export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushContactToHubSpot } from "@/lib/hubspot";
import { sanitize } from "@/lib/sanitize";
import { sendVerificationEmail } from "@/lib/mail";
import { validateAndNormalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function verifyToken(token: string, secret: string): any {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, data, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", secret)
    .update(`${header}.${data}`)
    .digest("base64url");
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      isB2B,
      companyName,
      gstNumber,
      registerMethod,
      turnstileToken,
      signupAttemptId,
      phoneVerificationToken
    } = body;

    // 1. Basic Fields Presence Checks
    if (!name || !password || !registerMethod) {
      return NextResponse.json({ error: "Name, password and registration method are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // 2. Full Name Validation
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || /\d/.test(trimmedName) || !/^[a-zA-Z\s'.]+$/.test(trimmedName)) {
      return NextResponse.json({ error: "Please enter a valid full name." }, { status: 400 });
    }

    const sName = sanitize(trimmedName);
    const sCompanyName = companyName ? sanitize(companyName) : null;
    const sGstNumber = gstNumber ? sanitize(gstNumber) : null;

    // 3. CAPTCHA Server Verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !turnstileSecret) {
      console.error("[AUTH] Missing Turnstile secret key in production.");
      return NextResponse.json({ error: "CAPTCHA service configuration is missing." }, { status: 500 });
    }

    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "CAPTCHA verification is required." }, { status: 400 });
      }

      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken
        })
      });

      if (!turnstileRes.ok) {
        return NextResponse.json({ error: "Failed to verify CAPTCHA." }, { status: 500 });
      }

      const turnstileJSON = await turnstileRes.json();
      if (!turnstileJSON.success) {
        return NextResponse.json({ error: "Invalid CAPTCHA token." }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 12);

    // 4. Method Specific Registration Flows
    if (registerMethod === "email") {
      if (!email) {
        return NextResponse.json({ error: "Email address is required." }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
      }

      const sEmail = sanitize(email).toLowerCase();

      const existingEmail = await prisma.user.findUnique({ where: { email: sEmail } });
      if (existingEmail) {
        if (existingEmail.emailVerified) {
          return NextResponse.json({ error: "An account already exists. Please log in." }, { status: 409 });
        } else {
          return NextResponse.json({ error: "This account has not been verified yet." }, { status: 409 });
        }
      }

      const user = await prisma.user.create({
        data: {
          name: sName,
          email: sEmail,
          password: hashed,
          role: "USER",
          companyName: isB2B ? sCompanyName : null,
          gstNumber: isB2B ? sGstNumber : null,
          isB2BApproved: false,
        },
      });

      // Generate email verification token
      await prisma.verificationToken.deleteMany({ where: { email: sEmail } });
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
      let emailSent = true;
      try {
        await sendVerificationEmail(sEmail, rawToken, sName);
      } catch (err) {
        console.error("[REGISTER_EMAIL_ERROR]", err);
        emailSent = false;
      }

      // HubSpot Integration
      if (isB2B) {
        const nameParts = sName.split(" ");
        await pushContactToHubSpot({
          email: sEmail,
          firstname: nameParts[0],
          lastname: nameParts.slice(1).join(" ") || undefined,
          company: sCompanyName || undefined,
          hs_lead_status: "NEW",
        });
      }

      return NextResponse.json({ success: true, emailSent, userId: user.id }, { status: 201 });

    } else if (registerMethod === "phone") {
      if (!phone || !signupAttemptId || !phoneVerificationToken) {
        return NextResponse.json({ error: "Phone number and OTP verification token are required." }, { status: 400 });
      }

      // Verification token binding validation: fail closed, never use static fallback
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
      if (!secret) {
        console.error("[AUTH] Server authentication secret is not configured.");
        return NextResponse.json({ error: "Server authentication configuration error." }, { status: 500 });
      }

      const payload = verifyToken(phoneVerificationToken, secret);

      if (!payload || payload.signupAttemptId !== signupAttemptId) {
        return NextResponse.json({ error: "Phone verification check failed or token expired." }, { status: 400 });
      }

      const verifiedPhone = payload.phone;
      const firebaseUid = payload.firebaseUid;

      // Ensure E.164 consistency
      const validation = validateAndNormalizePhone(verifiedPhone);
      if (!validation.isValid || !validation.normalized || validation.normalized !== verifiedPhone) {
        return NextResponse.json({ error: "Invalid phone number identity format." }, { status: 400 });
      }

      // Mismatch check: submitted phone must match token phone
      const submittedValidation = validateAndNormalizePhone(phone);
      if (!submittedValidation.isValid || submittedValidation.normalized !== verifiedPhone) {
        return NextResponse.json({ error: "Submitted phone number does not match verification token." }, { status: 400 });
      }

      // Check single-use consumption first
      const isConsumedEarly = await prisma.usedSignupAttempt.findUnique({
        where: { attemptId: signupAttemptId }
      });
      if (isConsumedEarly) {
        return NextResponse.json({ error: "Verification token has already been used." }, { status: 400 });
      }

      // Check duplicates for BOTH phone and firebaseUid
      const existingPhoneUser = await prisma.user.findFirst({
        where: { phone: verifiedPhone }
      });
      if (existingPhoneUser) {
        return NextResponse.json({ error: "An account already exists with this phone number. Please log in." }, { status: 409 });
      }

      if (firebaseUid) {
        const existingUidUser = await prisma.user.findUnique({
          where: { firebaseUid }
        });
        if (existingUidUser) {
          return NextResponse.json({ error: "An account already exists with this Firebase ID. Please log in." }, { status: 409 });
        }
      }

      let createdUserId: string;

      // Atomic consumption and creation transaction
      try {
        createdUserId = await prisma.$transaction(async (tx) => {
          // Double-check token has not been consumed atomically
          const isConsumed = await tx.usedSignupAttempt.findUnique({
            where: { attemptId: signupAttemptId }
          });
          if (isConsumed) {
            throw new Error("Verification token has already been used.");
          }

          // Consume the token atomically inside the transaction
          await tx.usedSignupAttempt.create({
            data: { attemptId: signupAttemptId }
          });

          // Create the User in database
          const newUser = await tx.user.create({
            data: {
              name: sName,
              phone: verifiedPhone,
              phoneVerified: new Date(),
              firebaseUid: firebaseUid || null,
              password: hashed,
              role: "USER",
              companyName: isB2B ? sCompanyName : null,
              gstNumber: isB2B ? sGstNumber : null,
              isB2BApproved: false,
            },
          });

          return newUser.id;
        });
      } catch (txError: any) {
        if (txError.message === "Verification token has already been used.") {
          return NextResponse.json({ error: txError.message }, { status: 400 });
        }
        throw txError; // Trigger global error block to rollback transaction
      }

      // HubSpot Integration
      if (isB2B) {
        const nameParts = sName.split(" ");
        try {
          await pushContactToHubSpot({
            phone: verifiedPhone,
            firstname: nameParts[0],
            lastname: nameParts.slice(1).join(" ") || undefined,
            company: sCompanyName || undefined,
            hs_lead_status: "NEW",
          });
        } catch (hubspotErr) {
          console.error("[REGISTER_HUBSPOT_ERROR]", hubspotErr);
        }
      }

      return NextResponse.json({ success: true, userId: createdUserId }, { status: 201 });
    } else {
      return NextResponse.json({ error: "Invalid registration method." }, { status: 400 });
    }
  } catch (err) {
    console.error("[REGISTER_ERROR]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
