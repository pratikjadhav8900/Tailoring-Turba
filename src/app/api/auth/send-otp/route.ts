import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAndNormalizePhone } from "@/lib/phone";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    // 1. Phone number validation and normalization using shared utility
    const validation = validateAndNormalizePhone(phone);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

    const normalizedPhone = validation.normalized; // E.164 canonical format

    // 2. Cooldown and Rate-Limiting Check
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Cooldown per phone number (60 seconds)
    const recentPhoneLog = await prisma.otpRequestLog.findFirst({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentPhoneLog) {
      return NextResponse.json({ error: "Please wait 60 seconds before requesting another OTP." }, { status: 429 });
    }

    // Cooldown per IP (60 seconds)
    const recentIpLog = await prisma.otpRequestLog.findFirst({
      where: {
        ip: clientIp,
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentIpLog) {
      return NextResponse.json({ error: "Please wait 60 seconds before requesting another OTP." }, { status: 429 });
    }

    // Hourly rate limit per IP (max 5 requests/hour)
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const hourlyIpLogs = await prisma.otpRequestLog.count({
      where: {
        ip: clientIp,
        createdAt: { gte: oneHourAgo }
      }
    });

    if (hourlyIpLogs >= 5) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again after an hour." }, { status: 429 });
    }

    // Create log record to enforce local rate-limiting / cooldown
    await prisma.otpRequestLog.create({
      data: {
        phone: normalizedPhone,
        ip: clientIp
      }
    });

    // 3. Duplicate Account Check
    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone }
    });

    if (existingUser && existingUser.phoneVerified) {
      return NextResponse.json({ error: "An account already exists. Please log in." }, { status: 409 });
    }

    const signupAttemptId = crypto.randomUUID();

    // 4. Configure Firebase Auth vs Mock Mode
    const hasFirebase = !!(
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );

    if (hasFirebase) {
      // Semantic redesign: Firebase handles the actual OTP dispatch on the frontend.
      // The backend validates parameters, checks rate limits, and registers the signup attempt.
      console.log(`[FIREBASE SIGNUP START] Attempt registered: ${signupAttemptId} for ${normalizedPhone}`);
    } else {
      const isProduction = process.env.NODE_ENV === "production";
      const enableMock = process.env.ENABLE_MOCK_AUTH === "true";

      if (isProduction || !enableMock) {
        console.error("[AUTH] Firebase configuration keys are missing.");
        return NextResponse.json({ error: "SMS configuration is missing." }, { status: 500 });
      }

      // Mock developer mode OTP logging (only for local unit/integration tests)
      console.log(`[DEVELOPMENT MOCK OTP] signupAttemptId: ${signupAttemptId}, phone: ${normalizedPhone}, Mock OTP Sent.`);
    }

    return NextResponse.json({ signupAttemptId });
  } catch (error: any) {
    console.error("[AUTH] send-otp error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
