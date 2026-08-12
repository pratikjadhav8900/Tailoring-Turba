export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "No verification token was provided." }, { status: 400 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "The verification link is invalid or has already been used." }, { status: 400 });
    }

    if (new Date(verificationToken.expires) < new Date()) {
      const expiredEmail = verificationToken.email;
      
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token: hashedToken },
      });

      return NextResponse.json({ 
        error: "This verification link is no longer valid.", 
        email: expiredEmail,
        expired: true
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email },
    });

    if (!user) {
      return NextResponse.json({ error: "No user account was found matching this verification request." }, { status: 400 });
    }

    // Update user and delete token transactionally
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token: hashedToken },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    console.error("[VERIFY_EMAIL_API_ERROR]", err);
    return NextResponse.json({ error: "An unexpected error occurred while verifying your email address." }, { status: 500 });
  }
}
