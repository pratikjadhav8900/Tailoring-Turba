import { NextRequest, NextResponse } from "next/server";
import { requireCrmAuth } from "@/lib/crm/auth";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/crm/csv";
import type { LeadSource } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_SOURCES: LeadSource[] = [
  "META_ADS",
  "GOOGLE_ADS",
  "WEBSITE",
  "REFERRAL",
  "OLD_CUSTOMER_DATA",
  "WALK_IN",
  "PHONE_INQUIRY",
  "WHATSAPP",
  "INSTAGRAM",
  "OTHER",
];

export async function POST(req: NextRequest) {
  const auth = await requireCrmAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { csv, defaultSource = "OLD_CUSTOMER_DATA", defaultAssignedToId } = body as {
      csv: string;
      defaultSource?: string;
      defaultAssignedToId?: string;
    };

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV content is required" }, { status: 400 });
    }

    const rows = parseCsv(csv);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }
    if (rows.length > 5000) {
      return NextResponse.json({ error: "Import limited to 5000 rows per file" }, { status: 400 });
    }

    const source = VALID_SOURCES.includes(defaultSource as LeadSource)
      ? (defaultSource as LeadSource)
      : "OLD_CUSTOMER_DATA";

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const name = r.name || r["customer"] || r["customer name"] || "";
      const phone = r.phone || r["phone number"] || r.mobile || "";
      const email = r.email || "";

      if (!name.trim() && !phone.trim()) {
        skipped++;
        errors.push(`Row ${i + 2}: missing both name and phone, skipped`);
        continue;
      }

      try {
        const lead = await prisma.lead.create({
          data: {
            name: name.trim() || phone.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            companyName: r.company || r["company name"] || null,
            city: r.city || null,
            requirements: r.requirements || r.notes || null,
            quantity: r.quantity ? Number(r.quantity) || null : null,
            notes: r.notes || null,
            source,
            sourceDetail: "CSV Import",
            assignedToId: defaultAssignedToId || null,
            createdById: auth.context.employee.id,
          },
        });

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: "IMPORTED",
            note: `Imported via CSV by ${auth.context.employee.name}`,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
          },
        });

        created++;
      } catch (rowErr: any) {
        skipped++;
        errors.push(`Row ${i + 2}: ${rowErr.message || "failed to import"}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      totalRows: rows.length,
      errors: errors.slice(0, 50),
    });
  } catch (error: any) {
    console.error("[CRM_IMPORT_LEADS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to import leads" }, { status: 500 });
  }
}
