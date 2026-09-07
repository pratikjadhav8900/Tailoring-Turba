export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { checkRateLimit, clearFailedResetAttempts } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Client IP rate-limiting (max 5 requests per 15 minutes)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipLimit = checkRateLimit(`forgot_pw_ip_${clientIp}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    // Email-based rate-limiting (max 3 requests per 15 minutes)
    const emailLimit = checkRateLimit(`forgot_pw_email_${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts for this account. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSeconds) } }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return generic success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a password reset code has been sent."
      });
    }

    // Generate cryptographically secure 6-digit OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Reset failed verification attempt counters
    clearFailedResetAttempts(normalizedEmail);

    // Delete existing tokens for this email and store the SHA-256 hash (never plaintext)
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      }),
      prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          otp: hashedOtp,
          expires,
        },
      }),
    ]);

    // Send the plaintext OTP strictly via transactional email (never logged or exposed in responses)
    await sendPasswordResetEmail(normalizedEmail, otp);

    return NextResponse.json({
      success: true,
      message: "If an account with this email exists, a password reset code has been sent."
    });

  } catch (error) {
    console.error("[AUTH] Forgot password request error");
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 }
    );
  }
}

