import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import { PartnerType, PartnerService } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/vendors
 * Search and filter vendor/partner directory.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const typeParam = searchParams.get("type") as PartnerType | null;
    const serviceParam = searchParams.get("service") as PartnerService | null;
    const locationParam = searchParams.get("location")?.trim() || "";
    const statusParam = searchParams.get("status") || "active"; // active, inactive, all
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

    const where: any = {};

    // Status filter
    if (statusParam === "active") {
      where.isActive = true;
    } else if (statusParam === "inactive") {
      where.isActive = false;
    }

    // Type filter
    if (typeParam && Object.values(PartnerType).includes(typeParam)) {
      where.partnerTypes = { has: typeParam };
    }

    // Service filter
    if (serviceParam && Object.values(PartnerService).includes(serviceParam)) {
      where.services = { has: serviceParam };
    }

    // Location filter
    if (locationParam && locationParam !== "ALL") {
      where.location = { equals: locationParam, mode: "insensitive" };
    }

    // General search across name, code, contact number, location, products, category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { products: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { subcategory: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vendors, totalCount] = await Promise.all([
      prisma.vendorPartner.findMany({
        where,
        orderBy: [{ name: "asc" }],
        take: limit,
        include: {
          _count: {
            select: {
              assignments: true,
              goodsMovements: true,
            },
          },
        },
      }),
      prisma.vendorPartner.count({ where }),
    ]);

    // Also collect unique locations for filter dropdown
    const distinctLocations = await prisma.vendorPartner.findMany({
      where: { location: { not: null } },
      select: { location: true },
      distinct: ["location"],
    });
    const locations = distinctLocations
      .map((l) => l.location)
      .filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      vendors,
      totalCount,
      locations,
    });
  } catch (error: any) {
    console.error("[OPS_GET_VENDORS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch vendors." }, { status: 500 });
  }
}

/**
 * POST /api/ops/vendors
 * Create a new vendor/partner (supports inline creation during assignment).
 */
export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      code,
      partnerTypes = [],
      services = [],
      category,
      subcategory,
      products,
      location,
      contactPersons,
      phone,
      email,
      panNumber,
      gstNumber,
      sourceNotes,
      internalNotes,
    } = body;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Vendor/Partner name is required." }, { status: 400 });
    }

    // Check code collision if code provided
    const trimmedCode = code?.trim() || null;
    if (trimmedCode) {
      const existing = await prisma.vendorPartner.findUnique({
        where: { code: trimmedCode },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Vendor code "${trimmedCode}" is already in use by ${existing.name}.` },
          { status: 409 }
        );
      }
    }

    const normalizedLocation = location?.trim() ? location.trim().toUpperCase() : null;

    const vendor = await prisma.vendorPartner.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        partnerTypes: Array.isArray(partnerTypes) ? partnerTypes : [],
        services: Array.isArray(services) ? services : [],
        category: category?.trim() || null,
        subcategory: subcategory?.trim() || null,
        products: products?.trim() || null,
        location: location?.trim() || null,
        normalizedLocation,
        contactPersons: contactPersons?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        panNumber: panNumber?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        sourceNotes: sourceNotes?.trim() || null,
        internalNotes: internalNotes?.trim() || null,
        isActive: true,
        createdBy: auth.context.employee.name,
      },
      include: {
        _count: {
          select: {
            assignments: true,
            goodsMovements: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      vendor,
      message: `Partner "${vendor.name}" registered successfully.`,
    });
  } catch (error: any) {
    console.error("[OPS_CREATE_VENDOR_ERROR]", error);
    return NextResponse.json({ error: "Failed to create vendor/partner." }, { status: 500 });
  }
}
