export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  checkRateLimit, 
  recordFailedResetAttempt, 
  getFailedResetAttempts, 
  clearFailedResetAttempts 
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // IP rate-limiting (max 10 verification attempts per 15 minutes)
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const ipLimit = checkRateLimit(`reset_pw_ip_${clientIp}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts from this address. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    // Check if max failed attempts already reached for this email
    const existingFailures = getFailedResetAttempts(normalizedEmail);
    if (existingFailures >= 5) {
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. This reset code has been invalidated. Please request a new code." },
        { status: 429 }
      );
    }

    // Find active token record for this email
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email: normalizedEmail },
    });

    if (!resetToken) {
      recordFailedResetAttempt(normalizedEmail);
      return NextResponse.json(
        { error: "Invalid or expired reset code." },
        { status: 400 }
      );
    }

    // Expiration check
    if (new Date() > resetToken.expires) {
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });
      clearFailedResetAttempts(normalizedEmail);
      return NextResponse.json(
        { error: "Invalid or expired reset code." },
        { status: 400 }
      );
    }

    // Timing-safe comparison of SHA-256 hash
    const incomingHashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    const storedHashBuffer = Buffer.from(resetToken.otp);
    const incomingHashBuffer = Buffer.from(incomingHashedOtp);

    const isMatch =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer);

    if (!isMatch) {
      const failedCount = recordFailedResetAttempt(normalizedEmail);

      // Invalidate token after 5 failed attempts
      if (failedCount >= 5) {
        await prisma.passwordResetToken.deleteMany({
          where: { email: normalizedEmail },
        });
        clearFailedResetAttempts(normalizedEmail);
        return NextResponse.json(
          { error: "Too many failed attempts. This reset code has been invalidated. Please request a new code." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Invalid verification code. ${5 - failedCount} attempts remaining.` },
        { status: 400 }
      );
    }

    // Verification succeeded — clear failed attempt count
    clearFailedResetAttempts(normalizedEmail);

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and invalidate reset token inside transactional boundary
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You may now log in."
    });

  } catch (error) {
    console.error("[AUTH] Reset password execution error");
    return NextResponse.json(
      { error: "Failed to process request. Please try again later." },
      { status: 500 }
    );
  }
}

