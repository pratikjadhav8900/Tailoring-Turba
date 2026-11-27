import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const lead = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.convertedUserId) {
      return NextResponse.json({ error: "Lead already converted", userId: lead.convertedUserId }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: the plain findUnique above is a stale read by
      // the time this transaction starts, so two near-simultaneous requests could both
      // pass the outer guard and each try to create a customer for the same lead.
      const freshLead = await tx.lead.findUnique({ where: { id: lead.id } });
      if (freshLead?.convertedUserId) {
        throw Object.assign(new Error("Lead already converted"), {
          code: "ALREADY_CONVERTED",
          userId: freshLead.convertedUserId,
        });
      }

      let user = lead.email
        ? await tx.user.findFirst({ where: { email: { equals: lead.email, mode: "insensitive" } } })
        : null;
      if (!user && lead.phone) {
        user = await tx.user.findFirst({ where: { phone: lead.phone } });
      }

      if (!user) {
        const phoneClean = lead.phone?.replace(/\D/g, "") || "";
        user = await tx.user.create({
          data: {
            name: lead.name,
            email: lead.email || `lead-${phoneClean || lead.id}@customers.tailoringturba.com`,
            phone: lead.phone || null,
            companyName: lead.companyName || null,
            role: "USER",
          },
        });
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: { convertedUserId: user.id, convertedAt: new Date(), status: "CONVERTED" },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "CONVERTED",
          note: `Converted to customer account by ${auth.context.employee.name}`,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
        },
      });

      return { user, lead: updatedLead };
    });

    return NextResponse.json({ success: true, userId: result.user.id, lead: result.lead });
  } catch (error: any) {
    if (error?.code === "ALREADY_CONVERTED") {
      return NextResponse.json({ error: "Lead already converted", userId: error.userId }, { status: 400 });
    }
    console.error("[CRM_CONVERT_LEAD_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to convert lead" }, { status: 500 });
  }
}
