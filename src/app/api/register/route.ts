import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushContactToHubSpot } from "@/lib/hubspot";
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashed,
        companyName: isB2B ? companyName : null,
        gstNumber: isB2B ? gstNumber : null,
        isB2BApproved: false,
      },
    });

    // Push B2B leads to HubSpot CRM
    if (isB2B) {
      const nameParts = name.trim().split(" ");
      await pushContactToHubSpot({
        email,
        firstname: nameParts[0],
        lastname: nameParts.slice(1).join(" ") || undefined,
        phone: phone || undefined,
        company: companyName || undefined,
        hs_lead_status: "NEW",
      });
    }

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
