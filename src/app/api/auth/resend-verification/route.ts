export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { sanitize } from "@/lib/sanitize";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const sEmail = sanitize(email).toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: sEmail },
    });

    // To prevent account-enumeration risk, we return a success response
    // if the email does not exist in the database.
    if (!user) {
      return NextResponse.json({ success: true, message: "Verification email sent if the account exists." });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "This email address is already verified." }, { status: 400 });
    }

    // Cooldown check (60 seconds)
    const existingToken = await prisma.verificationToken.findFirst({
      where: { email: sEmail },
      orderBy: { createdAt: "desc" },
    });

    if (existingToken) {
      const timeSinceLastToken = Date.now() - new Date(existingToken.createdAt).getTime();
      if (timeSinceLastToken < 60000) {
        const waitTime = Math.ceil((60000 - timeSinceLastToken) / 1000);
        return NextResponse.json({ error: `Please wait ${waitTime} seconds before requesting another email.` }, { status: 429 });
      }
    }

    // Invalidate/delete any previous tokens for the same email
    await prisma.verificationToken.deleteMany({
      where: { email: sEmail },
    });

    // Generate cryptographically secure raw token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        email: sEmail,
        token: hashedToken,
        expires,
      },
    });

    // Send verification email
    await sendVerificationEmail(sEmail, rawToken, user.name);

    return NextResponse.json({ success: true, message: "Verification email sent." });
  } catch (err) {
    console.error("[RESEND_VERIFICATION_ERROR]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
