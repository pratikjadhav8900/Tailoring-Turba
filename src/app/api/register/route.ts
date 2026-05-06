export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushContactToHubSpot } from "@/lib/hubspot";
import { sanitize } from "@/lib/sanitize";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, isB2B, companyName, gstNumber } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const sName = sanitize(name);
    const sEmail = sanitize(email);
    const sPhone = phone ? sanitize(phone) : null;
    const sCompanyName = companyName ? sanitize(companyName) : null;
    const sGstNumber = gstNumber ? sanitize(gstNumber) : null;

    const existing = await prisma.user.findUnique({ where: { email: sEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: sName,
        email: sEmail,
        phone: sPhone,
        password: hashed,
        companyName: isB2B ? sCompanyName : null,
        gstNumber: isB2B ? sGstNumber : null,
        isB2BApproved: false,
      },
    });

    // Push B2B leads to HubSpot CRM
    if (isB2B) {
      const nameParts = sName.trim().split(" ");
      await pushContactToHubSpot({
        email: sEmail,
        firstname: nameParts[0],
        lastname: nameParts.slice(1).join(" ") || undefined,
        phone: sPhone || undefined,
        company: sCompanyName || undefined,
        hs_lead_status: "NEW",
      });
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

