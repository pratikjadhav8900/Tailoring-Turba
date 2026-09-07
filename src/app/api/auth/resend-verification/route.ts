export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";
import { sanitize } from "@/lib/sanitize";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    // 1. IP-level rate limiting to prevent email cycling attacks (max 5 requests per 15 minutes)
    const ipLimit = checkRateLimit(`resend_verification_ip_${clientIp}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many verification requests from this IP. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const sEmail = sanitize(email).toLowerCase();

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: sEmail },
    });

    // 3. Generic response prevents account enumeration
    const genericSuccessResponse = {
      success: true,
      message: "If an account exists with this email and is pending verification, a new link has been sent.",
    };

    if (!user) {
      return NextResponse.json(genericSuccessResponse);
    }

    if (user.emailVerified) {
      return NextResponse.json(genericSuccessResponse);
    }

    // 4. Cooldown check (60 seconds per email)
    const existingToken = await prisma.verificationToken.findFirst({
      where: { email: sEmail },
      orderBy: { createdAt: "desc" },
    });

    if (existingToken) {
      const timeSinceLastToken = Date.now() - new Date(existingToken.createdAt).getTime();
      if (timeSinceLastToken < 60000) {
        const waitTime = Math.ceil((60000 - timeSinceLastToken) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitTime} seconds before requesting another email.` },
          { status: 429 }
        );
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

    return NextResponse.json(genericSuccessResponse);
  } catch (err) {
    console.error("[RESEND_VERIFICATION_ERROR]", err);
    return NextResponse.json({ error: "Failed to process verification request." }, { status: 500 });
  }
}
