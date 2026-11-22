import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import type { LeadSource, LeadStage } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "all";
    const status = searchParams.get("status") as LeadStage | null;
    const statuses = searchParams.getAll("statuses") as LeadStage[];
    const source = searchParams.get("source") as LeadSource | null;
    const sources = searchParams.getAll("sources") as LeadSource[];
    const assignedToId = searchParams.get("assignedToId");
    const quality = searchParams.get("quality"); // HOT | WARM | COLD
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minQuantity = searchParams.get("minQuantity");
    const minExpectedValue = searchParams.get("minExpectedValue");
    const noActivityDays = searchParams.get("noActivityDays");
    const tagId = searchParams.get("tagId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    switch (tab) {
      case "favourite":
        where.isFavourite = true;
        break;
      case "new":
        where.status = "NEW_LEAD";
        break;
      case "assigned-to-me":
        where.assignedToId = auth.context.employee.id;
        break;
      case "overdue":
        where.nextFollowUpAt = { lt: new Date() };
        where.status = { notIn: ["CONVERTED", "CLOSED", "NOT_INTERESTED"] };
        break;
      case "hot":
        where.score = { gte: 8 };
        break;
      default:
        break;
    }

    if (status) where.status = status;
    if (statuses.length > 0) where.status = { in: statuses };
    if (source) where.source = source;
    if (sources.length > 0) where.source = { in: sources };
    if (assignedToId) where.assignedToId = assignedToId === "unassigned" ? null : assignedToId;

    if (quality === "HOT") where.score = { gte: 8 };
    else if (quality === "WARM") where.score = { gte: 4, lt: 8 };
    else if (quality === "COLD") where.score = { lt: 4 };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (minQuantity) where.quantity = { gte: Number(minQuantity) };
    if (minExpectedValue) where.expectedValue = { gte: Number(minExpectedValue) };

    if (noActivityDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(noActivityDays));
      where.OR = [{ lastContactedAt: null }, { lastContactedAt: { lt: cutoff } }];
      where.AND = [{ createdAt: { lt: cutoff } }];
    }

    if (tagId) {
      where.tags = { some: { tagId } };
    }

    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
      // noActivityDays already uses `where.OR`; combine rather than overwrite.
      if (where.OR) {
        where.AND = [...(where.AND || []), { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }

    const [leads, totalCount, statCounts] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        include: {
          assignedTo: { select: { id: true, name: true, employeeCode: true } },
          createdBy: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          _count: { select: { tasks: { where: { status: { in: ["PENDING", "IN_PROGRESS"] } } } } },
        },
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const formatted = leads.map((l) => ({
      ...l,
      openTaskCount: l._count.tasks,
    }));

    return NextResponse.json({
      leads: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      statusCounts: statCounts.reduce((acc: Record<string, number>, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
    });
  } catch (error: any) {
    console.error("[CRM_GET_LEADS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      companyName,
      source = "OTHER",
      sourceDetail,
      requirements,
      quantity,
      productCategory,
      expectedValue,
      city,
      notes,
      assignedToId,
      score = 0,
      force = false,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Lead name is required" }, { status: 400 });
    }

    const cleanPhone = phone?.trim() || null;
    const cleanEmail = email?.trim() || null;

    if (!force && (cleanPhone || cleanEmail)) {
      const duplicate = await prisma.lead.findFirst({
        where: {
          OR: [
            ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, name: true, status: true, assignedTo: { select: { name: true } }, createdAt: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: "A lead with this phone or email already exists",
            duplicate,
          },
          { status: 409 }
        );
      }
    }

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          companyName: companyName?.trim() || null,
          source,
          sourceDetail: sourceDetail?.trim() || null,
          requirements: requirements?.trim() || null,
          quantity: quantity ? Number(quantity) : null,
          productCategory: productCategory?.trim() || null,
          expectedValue: expectedValue ? Number(expectedValue) : null,
          city: city?.trim() || null,
          notes: notes?.trim() || null,
          score: Math.max(0, Math.min(10, Number(score) || 0)),
          assignedToId: assignedToId || null,
          createdById: auth.context.employee.id,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: "NOTE",
          note: `Lead created by ${auth.context.employee.name}`,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
        },
      });

      if (assignedToId) {
        await tx.leadActivity.create({
          data: {
            leadId: created.id,
            type: "ASSIGNED",
            note: `Assigned on creation`,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            metadata: { to: assignedToId },
          },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("[CRM_CREATE_LEAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create lead" }, { status: 500 });
  }
}
