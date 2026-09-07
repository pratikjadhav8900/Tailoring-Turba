import { describe, it, expect, beforeEach, vi } from "vitest";
import crypto from "crypto";

// Mock prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      passwordResetToken: {
        findFirst: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      processedWebhookEvent: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      shipment: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      order: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      orderTimelineEvent: {
        create: vi.fn(),
      },
      outboxNotification: {
        create: vi.fn(),
      },
      usedSignupAttempt: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      verificationToken: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      otpRequestLog: {
        findFirst: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (args) => {
        if (Array.isArray(args)) {
          return Promise.all(args);
        }
        if (typeof args === "function") {
          return args(mockPrisma);
        }
        return args;
      }),
    },
  };
});

// Mock mail
vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

// Mock firebaseAdmin
vi.mock("@/lib/firebaseAdmin", () => ({
  adminAuth: null,
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock hubspot
vi.mock("@/lib/hubspot", () => ({
  pushContactToHubSpot: vi.fn().mockResolvedValue(true),
}));

import { prisma as mockPrisma } from "@/lib/prisma";
import { resetRateLimitStores } from "@/lib/rate-limit";

// Helper to sign JWT-like tokens
function signToken(payload: any, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

describe("Security Remediation Suite (14 Invariants)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TURNSTILE_SECRET_KEY; // Disable turnstile during unit tests
    vi.clearAllMocks();
    resetRateLimitStores();
  });

  // Test 1: OTP verification without AUTH_SECRET fails closed
  it("Invariant 1: OTP verification without AUTH_SECRET fails closed with 500 error", async () => {
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    (process.env as any).NODE_ENV = "test";
    process.env.ENABLE_MOCK_AUTH = "true";

    const { POST } = await import("@/app/api/auth/verify-otp/route");
    const req = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+919876543210",
        otp: "123456",
        signupAttemptId: "attempt-123",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Server authentication configuration error.");
  });

  // Test 2: OTP token cannot be forged with hardcoded fallback
  it("Invariant 2: Registration rejects OTP tokens forged with hardcoded fallback string", async () => {
    process.env.AUTH_SECRET = "real-production-secret-configured-properly-32chars";
    delete process.env.NEXTAUTH_SECRET;

    // Attacker generates token using the old leaked fallback secret
    const forgedPayload = {
      signupAttemptId: "forged-attempt",
      firebaseUid: "forged-uid",
      phone: "+919876543210",
      exp: Math.floor(Date.now() / 1000) + 300,
    };
    const forgedToken = signToken(forgedPayload, "fallback-secret-for-jwt-signing");

    const { POST } = await import("@/app/api/register/route");
    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        password: "SecurePassword123!",
        registerMethod: "phone",
        phone: "+919876543210",
        signupAttemptId: "forged-attempt",
        phoneVerificationToken: forgedToken,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("verification check failed or token expired");
  });

  // Test 3: BigShip webhook without secret is rejected with 401
  it("Invariant 3: BigShip webhook without secret is rejected with HTTP 401", async () => {
    process.env.BIGSHIP_WEBHOOK_SECRET = "super-secret-bigship-webhook-token-32ch";

    const { POST } = await import("@/app/api/webhooks/bigship/route");
    const req: any = new Request("http://localhost:3000/api/webhooks/bigship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awb: "AWB12345", status: "DELIVERED" }),
    });
    req.nextUrl = new URL("http://localhost:3000/api/webhooks/bigship");

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Missing webhook authentication");
  });

  // Test 4: BigShip webhook with invalid secret is rejected with 403
  it("Invariant 4: BigShip webhook with invalid secret is rejected with HTTP 403", async () => {
    process.env.BIGSHIP_WEBHOOK_SECRET = "super-secret-bigship-webhook-token-32ch";

    const { POST } = await import("@/app/api/webhooks/bigship/route");
    const req: any = new Request("http://localhost:3000/api/webhooks/bigship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bigship-secret": "wrong-invalid-secret-key-attacker",
      },
      body: JSON.stringify({ awb: "AWB12345", status: "DELIVERED" }),
    });
    req.nextUrl = new URL("http://localhost:3000/api/webhooks/bigship");

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Invalid webhook secret");
  });

  // Test 5: BigShip webhook with valid secret is processed (200)
  it("Invariant 5: BigShip webhook with valid secret is authorized and processed", async () => {
    process.env.BIGSHIP_WEBHOOK_SECRET = "super-secret-bigship-webhook-token-32ch";

    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue(null);
    (mockPrisma.shipment.findFirst as any).mockResolvedValue({
      id: "shipment-1",
      orderId: "order-1",
      status: "IN_TRANSIT",
      checkpoints: [],
      order: {
        id: "order-1",
        status: "CONFIRMED",
        totalAmount: 1000,
        paymentTransactions: [],
      },
    });
    (mockPrisma.shipment.update as any).mockResolvedValue({});
    (mockPrisma.processedWebhookEvent.create as any).mockResolvedValue({});

    const { POST } = await import("@/app/api/webhooks/bigship/route");
    const req: any = new Request("http://localhost:3000/api/webhooks/bigship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bigship-secret": "super-secret-bigship-webhook-token-32ch",
      },
      body: JSON.stringify({
        event_id: "evt_test_1001",
        awb: "AWB12345",
        status: "OUT FOR DELIVERY",
        location: "Pune Hub",
      }),
    });
    req.nextUrl = new URL("http://localhost:3000/api/webhooks/bigship");

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(mockPrisma.shipment.update).toHaveBeenCalled();
  });

  // Test 6: Duplicate BigShip webhook is idempotently ignored
  it("Invariant 6: Duplicate BigShip webhook is recognized and skipped idempotently", async () => {
    process.env.BIGSHIP_WEBHOOK_SECRET = "super-secret-bigship-webhook-token-32ch";

    (mockPrisma.processedWebhookEvent.findUnique as any).mockResolvedValue({
      id: "existing-evt",
      provider: "BIGSHIP",
      eventId: "evt_duplicate_999",
    });

    const { POST } = await import("@/app/api/webhooks/bigship/route");
    const req: any = new Request("http://localhost:3000/api/webhooks/bigship", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bigship-secret": "super-secret-bigship-webhook-token-32ch",
      },
      body: JSON.stringify({
        event_id: "evt_duplicate_999",
        awb: "AWB12345",
        status: "IN_TRANSIT",
      }),
    });
    req.nextUrl = new URL("http://localhost:3000/api/webhooks/bigship");

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("already_processed");
    expect(mockPrisma.shipment.update).not.toHaveBeenCalled();
  });

  // Test 7: Password reset OTP brute-force is blocked after 5 failures and token deleted
  it("Invariant 7: Password reset OTP brute-force attempt is blocked after 5 failures and token is invalidated", async () => {
    const email = "victim@example.com";
    const correctOtp = "654321";
    const correctHash = crypto.createHash("sha256").update(correctOtp).digest("hex");

    (mockPrisma.passwordResetToken.findFirst as any).mockResolvedValue({
      id: "token-id-1",
      email,
      otp: correctHash,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    const { POST } = await import("@/app/api/auth/reset-password/route");

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const req = new Request("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: "00000" + i, newPassword: "NewSecurePassword123!" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("attempts remaining");
    }

    // 5th failed attempt -> Lockout & Invalidation
    const fifthReq = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: "000005", newPassword: "NewSecurePassword123!" }),
    });
    const fifthRes = await POST(fifthReq);
    expect(fifthRes.status).toBe(429);
    const fifthData = await fifthRes.json();
    expect(fifthData.error).toContain("Too many failed attempts. This reset code has been invalidated");
    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { email },
    });
  });

  // Test 8: Password reset OTP cannot be read from database as plaintext
  it("Invariant 8: Forgot password generates cryptographically secure OTP and stores only SHA-256 hash in DB", async () => {
    (mockPrisma.user.findUnique as any).mockResolvedValue({ id: "user-1", email: "user@example.com" });

    let createdTokenData: any = null;
    (mockPrisma.passwordResetToken.create as any).mockImplementation(({ data }: any) => {
      createdTokenData = data;
      return Promise.resolve(data);
    });

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(createdTokenData).toBeDefined();

    // Verify stored OTP is a 64-character hex SHA-256 hash, NOT a 6-digit plaintext number
    expect(createdTokenData.otp).toMatch(/^[a-f0-9]{64}$/);
    expect(createdTokenData.otp.length).toBe(64);
  });

  // Test 9: Mock authentication cannot activate outside NODE_ENV=test
  it("Invariant 9: Mock authentication cannot activate in development or production even if ENABLE_MOCK_AUTH=true", async () => {
    (process.env as any).NODE_ENV = "development";
    process.env.ENABLE_MOCK_AUTH = "true";

    const { POST } = await import("@/app/api/auth/verify-otp/route");
    const req = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "+919876543210",
        otp: "123456",
        signupAttemptId: "attempt-1",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid verification request parameters.");
  });

  // Test 10: Admin role cannot be escalated through registration
  it("Invariant 10: Registering with tailoringturba@gmail.com cannot escalate role to SUPER_ADMIN", async () => {
    (mockPrisma.user.findUnique as any).mockResolvedValue(null);

    let createdUserData: any = null;
    (mockPrisma.user.create as any).mockImplementation(({ data }: any) => {
      createdUserData = data;
      return Promise.resolve({ id: "user-new", ...data });
    });

    const { POST } = await import("@/app/api/register/route");
    const req = new Request("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "tailoringturba@gmail.com",
        password: "SuperSecretPassword123!",
        registerMethod: "email",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    expect(createdUserData).toBeDefined();
    // Role MUST remain standard USER, not SUPER_ADMIN
    expect(createdUserData.role).toBe("USER");
    expect(createdUserData.isB2BApproved).toBe(false);
  });

  // Test 11: Public tracking rate limit activates
  it("Invariant 11: Public tracking endpoint activates rate limiting against rapid requests", async () => {
    (mockPrisma.order.findFirst as any).mockResolvedValue({
      id: "ord-1",
      orderNumber: 1001,
      items: [],
      shipments: [],
      timelineEvents: [],
      paymentTransactions: [],
    });

    const { POST } = await import("@/app/api/orders/track-public/route");

    // Make 16 requests from the same IP (limit is 15/min)
    let lastRes: any = null;
    for (let i = 0; i < 16; i++) {
      const req: any = new Request("http://localhost:3000/api/orders/track-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.45",
        },
        body: JSON.stringify({
          orderIdentifier: `100${i}`,
          contactInfo: `client${i}@example.com`,
        }),
      });
      lastRes = await POST(req);
    }

    expect(lastRes.status).toBe(429);
    const data = await lastRes.json();
    expect(data.error).toContain("Too many tracking attempts");
  });

  // Test 12: Razorpay webhook without dedicated secret fails closed
  it("Invariant 12: Razorpay webhook without dedicated RAZORPAY_WEBHOOK_SECRET fails closed with 500", async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    // Even if RAZORPAY_KEY_SECRET is set, it must NOT fall back
    process.env.RAZORPAY_KEY_SECRET = "some-razorpay-key-secret";

    const { POST } = await import("@/app/api/webhooks/razorpay/route");
    const req: any = new Request("http://localhost:3000/api/webhooks/razorpay", {
      method: "POST",
      headers: {
        "x-razorpay-signature": "some_sig",
      },
      body: JSON.stringify({ event: "payment.captured" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Webhook configuration missing");
  });

  // Test 13: No sensitive auth objects logged in auth.ts
  it("Invariant 13: auth.ts does not serialize or log user, password, or account objects", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const authCode = fs.readFileSync(path.resolve(__dirname, "../lib/auth.ts"), "utf-8");

    // Verify all dangerous log patterns are removed
    expect(authCode).not.toContain("[ADAPTER] getUserByAccount returned");
    expect(authCode).not.toContain("[ADAPTER] getUserByEmail found user");
    expect(authCode).not.toContain("[ADAPTER] linkAccount called with");
    expect(authCode).not.toContain("JSON.stringify(user)");
    expect(authCode).not.toContain("JSON.stringify(account)");
    expect(authCode).not.toContain("JSON.stringify(res)");
  });

  // Test 14: Upload endpoint does not expose internal error details to client
  it("Invariant 14: Upload endpoint returns generic safe error without leaking error.message", async () => {
    const { POST } = await import("@/app/api/upload/route");

    // Pass a request whose formData parsing fails with an internal error
    const req = {
      formData: vi.fn().mockRejectedValue(new Error("/var/www/internal/system/database.sock read error")),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Upload failed. Please ensure the file is a valid image/PDF and try again.");
    // Internal path or error details must NOT be exposed to client
    expect(data.details).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain("/var/www/internal");
  });
});
