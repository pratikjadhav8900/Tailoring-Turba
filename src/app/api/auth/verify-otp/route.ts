import { NextResponse } from "next/server";
import { validateAndNormalizePhone } from "@/lib/phone";
import { adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

function signToken(payload: any, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const { phone, otp, idToken, signupAttemptId } = await request.json();

    if (!phone || !signupAttemptId) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    // 1. Phone number validation and normalization using shared utility
    const validation = validateAndNormalizePhone(phone);
    if (!validation.isValid || !validation.normalized) {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

    const normalizedPhone = validation.normalized;

    const isProduction = process.env.NODE_ENV === "production";
    const enableMock = process.env.ENABLE_MOCK_AUTH === "true";
    const hasAdmin = !!adminAuth;

    let firebaseUid = "";
    let isApproved = false;

    // 2. Perform Verification
    if (isProduction && !hasAdmin) {
      console.error("[AUTH] Missing production Firebase Admin SDK credentials.");
      return NextResponse.json({ error: "Auth service configuration is missing." }, { status: 500 });
    }

    if (idToken && hasAdmin) {
      try {
        // Authoritative ID Token verification using Firebase Admin SDK
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const decodedToken = await adminAuth!.verifyIdToken(idToken);
        firebaseUid = decodedToken.uid;
        const verifiedPhone = decodedToken.phone_number; // e.g. +919876543210

        // Strict Phone Number & Identity Check
        if (!verifiedPhone || verifiedPhone !== normalizedPhone) {
          console.error("[AUTH] Phone identity mismatch during token verification.");
          return NextResponse.json({ error: "Phone identity verification failed. Mismatched phone numbers." }, { status: 400 });
        }

        isApproved = true;
      } catch (err: any) {
        console.error("[AUTH] Firebase token verification failed");
        return NextResponse.json({ error: "Invalid or expired Firebase ID token." }, { status: 400 });
      }
    } else {
      // Mock Mode is STRICTLY restricted to NODE_ENV === "test"
      const isTestEnv = process.env.NODE_ENV === "test";
      const isMockAllowed = isTestEnv && process.env.ENABLE_MOCK_AUTH === "true";

      if (!isMockAllowed) {
        return NextResponse.json({ error: "Invalid verification request parameters." }, { status: 400 });
      }

      if (otp === "123456" || (otp && otp.length === 6 && /^\d+$/.test(otp))) {
        isApproved = true;
        const hash = crypto.createHash("md5").update(normalizedPhone).digest("hex");
        firebaseUid = `mock-firebase-uid-${hash}`;
      }
    }

    if (!isApproved) {
      return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
    }

    // 3. Issue short-lived phoneVerificationToken (5-minute expiration)
    // Fail closed: Never use hardcoded fallback secrets
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[AUTH] Server authentication secret is not configured.");
      return NextResponse.json({ error: "Server authentication configuration error." }, { status: 500 });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expirySec = nowSec + 300; // 5 minutes

    const tokenPayload = {
      signupAttemptId,
      firebaseUid,
      phone: normalizedPhone,
      iat: nowSec,
      exp: expirySec,
      jti: crypto.randomBytes(16).toString("hex")
    };

    const phoneVerificationToken = signToken(tokenPayload, secret);

    return NextResponse.json({ phoneVerificationToken });
  } catch (error: any) {
    console.error("[AUTH] verify-otp processing error");
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
