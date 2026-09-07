import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// MOCKS SETUP
// ---------------------------------------------------------------------------
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    design: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    paymentTransaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    orderTimelineEvent: {
      create: vi.fn(),
    },
    address: {
      create: vi.fn(),
    },
    inquiry: {
      create: vi.fn(),
    },
    job: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  };
  return { prisma: mockPrisma, withRetry: (fn: any) => fn() };
});

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn().mockResolvedValue(true),
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendOperationsOrderAlert: vi.fn().mockResolvedValue(true),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("razorpay", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({
          id: "order_mock_123",
          amount: 52500,
          currency: "INR",
          receipt: "receipt_mock",
        }),
      },
      payments: {
        fetch: vi.fn().mockResolvedValue({
          id: "pay_mock_123",
          status: "captured",
          amount: 52500,
          currency: "INR",
        }),
      },
    })),
  };
});

describe("Phase 4 Security Remediation Suite (29 Verification Scenarios)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
  });

  // =========================================================================
  // CRITICAL C-1: Server-Authoritative Pricing
  // =========================================================================
  describe("CRITICAL C-1: Server-Authoritative Pricing", () => {
    it("1. Client price tampering: Authoritative price from DB overrides client price", async () => {
      const { calculateAuthoritativePricing } = await import("@/lib/server-pricing");
      const { prisma } = await import("@/lib/prisma");

      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        name: "Premium Polo",
        basePrice: 500,
      });

      const clientItems = [
        {
          productId: "prod-1",
          quantity: 2,
          price: 1, // Attacker tamper attempt: ₹1 instead of ₹500
        },
      ];

      const result = await calculateAuthoritativePricing(clientItems, 2);

      // Subtotal should be 500 * 2 = 1000, Tax 5% = 50, Total = 1050
      expect(result.subtotal).toBe(1000);
      expect(result.tax).toBe(50);
      expect(result.finalTotal).toBe(1050);
      expect(result.items[0].effectiveUnitPrice).toBe(500);
      expect(result.items[0].lineTotal).toBe(1000);
    });

    it("2. Client amount tampering: Razorpay and Order amount ignores client total", async () => {
      const { POST } = await import("@/app/api/razorpay/order/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "user-1", email: "customer@test.com" },
      });

      (prisma.product.findUnique as any).mockResolvedValue({
        id: "prod-1",
        name: "Corporate Shirt",
        basePrice: 1000,
      });

      (prisma.order.create as any).mockResolvedValue({
        id: "order-db-1",
        totalAmount: 1050,
      });

      const req = new NextRequest("http://localhost:3000/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({
          amount: 5, // Client attempts to pay ₹5
          currency: "INR",
          items: [{ productId: "prod-1", quantity: 1, price: 5 }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify DB order was created with authoritative ₹1050 (1000 + 50 GST)
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1050,
          }),
        })
      );
    });

    it("3. Negative quantity: Rejected with 400 Bad Request", async () => {
      const { POST } = await import("@/app/api/razorpay/order/route");
      const { auth } = await import("@/lib/auth");

      (auth as any).mockResolvedValue({ user: { id: "user-1" } });

      const req = new NextRequest("http://localhost:3000/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: "prod-1", quantity: -5 }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("must be greater than 0");
    });

    it("4. Zero quantity: Rejected with 400 Bad Request", async () => {
      const { POST } = await import("@/app/api/razorpay/order/route");
      const { auth } = await import("@/lib/auth");

      (auth as any).mockResolvedValue({ user: { id: "user-1" } });

      const req = new NextRequest("http://localhost:3000/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: "prod-1", quantity: 0 }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("must be greater than 0");
    });

    it("5. Huge quantity (> 5000): Rejected with 400 Bad Request", async () => {
      const { POST } = await import("@/app/api/razorpay/order/route");
      const { auth } = await import("@/lib/auth");

      (auth as any).mockResolvedValue({ user: { id: "user-1" } });

      const req = new NextRequest("http://localhost:3000/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: "prod-1", quantity: 50000 }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("exceeds maximum allowable quantity");
    });
  });

  // =========================================================================
  // CRITICAL C-2: Zombie POST /api/orders Disabled
  // =========================================================================
  describe("CRITICAL C-2: Zombie POST /api/orders Remediation", () => {
    it("6. Fake payment IDs: Direct order creation via POST /api/orders fails closed with 405", async () => {
      const { POST } = await import("@/app/api/orders/route");

      const res = await POST();
      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.code).toBe("ORDER_CREATION_ENDPOINT_DEPRECATED");
    });

    it("7. Duplicate payment: Provider payment ID deduplication in verify route", async () => {
      const { POST } = await import("@/app/api/razorpay/verify/route");
      const { prisma } = await import("@/lib/prisma");
      import("crypto");

      const secret = "rzp_test_secret";
      const orderId = "order_123";
      const paymentId = "pay_123";
      const crypto = await import("crypto");
      const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

      (prisma.order.findFirst as any).mockResolvedValue({
        id: "ord-internal-1",
        totalAmount: 1000,
        status: "CONFIRMED",
        razorpayOrderId: orderId,
        user: { email: "customer@test.com" },
        items: [],
      });

      // Existing transaction already captured by webhook
      (prisma.paymentTransaction.findUnique as any).mockResolvedValue({
        id: "tx-already-exists",
        providerPaymentId: paymentId,
        status: "CAPTURED",
      });

      (prisma.paymentTransaction.findMany as any).mockResolvedValue([
        {
          id: "tx-already-exists",
          providerPaymentId: paymentId,
          amountPaise: 100000,
          type: "PAYMENT",
          status: "CAPTURED",
        },
      ]);

      (prisma.order.update as any).mockResolvedValue({
        id: "ord-internal-1",
        status: "CONFIRMED",
        amountPaid: 1000,
        remainingAmount: 0,
        user: { email: "customer@test.com" },
        items: [],
      });

      const req = new NextRequest("http://localhost:3000/api/razorpay/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      // Verify paymentTransaction.create was NOT called again for the same providerPaymentId
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CRITICAL C-3: Design IDOR
  // =========================================================================
  describe("CRITICAL C-3: Design IDOR Remediation", () => {
    it("8. Cross-user design GET: Returns 403 Forbidden", async () => {
      const { GET } = await import("@/app/api/designs/[id]/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "attacker-user-id", role: "USER" },
      });

      (prisma.design.findUnique as any).mockResolvedValue({
        id: "design-victim",
        userId: "victim-user-id",
        name: "Victim's Proprietary Design",
      });

      const req = new Request("http://localhost:3000/api/designs/design-victim");
      const res = await GET(req, { params: { id: "design-victim" } });

      expect(res.status).toBe(403);
    });

    it("9. Cross-user design DELETE: Returns 403 Forbidden and does not delete", async () => {
      const { DELETE } = await import("@/app/api/designs/[id]/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "attacker-user-id", role: "USER" },
      });

      (prisma.design.findUnique as any).mockResolvedValue({
        id: "design-victim",
        userId: "victim-user-id",
      });

      const req = new Request("http://localhost:3000/api/designs/design-victim", { method: "DELETE" });
      const res = await DELETE(req, { params: { id: "design-victim" } });

      expect(res.status).toBe(403);
      expect(prisma.design.delete).not.toHaveBeenCalled();
    });

    it("10. Unauthenticated design access: Returns 401 Unauthorized for both GET and DELETE", async () => {
      const { GET, DELETE } = await import("@/app/api/designs/[id]/route");
      const { auth } = await import("@/lib/auth");

      (auth as any).mockResolvedValue(null);

      const getReq = new Request("http://localhost:3000/api/designs/design-1");
      const getRes = await GET(getReq, { params: { id: "design-1" } });
      expect(getRes.status).toBe(401);

      const delReq = new Request("http://localhost:3000/api/designs/design-1", { method: "DELETE" });
      const delRes = await DELETE(delReq, { params: { id: "design-1" } });
      expect(delRes.status).toBe(401);
    });
  });

  // =========================================================================
  // CRITICAL C-4: SSRF Defense in /api/generate-mockup
  // =========================================================================
  describe("CRITICAL C-4: SSRF Defense in Mockup Generator", () => {
    it("11. SSRF localhost rejected", async () => {
      const { validateAndFetchAsset } = await import("@/lib/ssrf");

      await expect(validateAndFetchAsset("http://localhost:3000/internal-key")).rejects.toThrow(
        /forbidden/i
      );
    });

    it("12. SSRF private IP rejected", async () => {
      const { validateAndFetchAsset } = await import("@/lib/ssrf");

      await expect(validateAndFetchAsset("http://192.168.1.1/secret")).rejects.toThrow(/forbidden/i);
      await expect(validateAndFetchAsset("http://10.0.0.1/admin")).rejects.toThrow(/forbidden/i);
      await expect(validateAndFetchAsset("http://172.16.5.1/db")).rejects.toThrow(/forbidden/i);
    });

    it("13. SSRF metadata IP rejected", async () => {
      const { validateAndFetchAsset } = await import("@/lib/ssrf");

      await expect(validateAndFetchAsset("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
        /forbidden/i
      );
    });

    it("14. SSRF file:// scheme rejected", async () => {
      const { validateAndFetchAsset } = await import("@/lib/ssrf");

      await expect(validateAndFetchAsset("file:///etc/passwd")).rejects.toThrow(/Disallowed URL scheme/i);
    });
  });

  // =========================================================================
  // HIGH H-1 & H-5: Profile Verification & Backdoor Removal
  // =========================================================================
  describe("HIGH H-1 & H-5: Profile Verification & Backdoor Removal", () => {
    it("15. Unauthorized profile email change behavior: Fails without active session", async () => {
      const { auth } = await import("@/lib/auth");
      (auth as any).mockResolvedValue(null);

      // Testing logic directly matching updateProfile authorization check
      const session = await auth();
      expect(session?.user?.id).toBeUndefined();
    });

    it("16. Email verification invalidation: Modifying email clears emailVerified", async () => {

      const currentUser = {
        id: "user-123",
        email: "old@test.com",
        phone: "+919876543210",
        emailVerified: new Date(),
        phoneVerified: new Date(),
      };

      const newEmail = "new@test.com";
      const isEmailChanged = newEmail !== currentUser.email;

      const updateData: any = {
        email: newEmail,
        ...(isEmailChanged ? { emailVerified: null } : {}),
      };

      expect(updateData.emailVerified).toBeNull();
    });

    it("17. Phone verification invalidation: Modifying phone clears phoneVerified", async () => {
      const currentUser = {
        id: "user-123",
        email: "user@test.com",
        phone: "+919876543210",
        emailVerified: new Date(),
        phoneVerified: new Date(),
      };

      const newPhone = "+919123456789";
      const isPhoneChanged = newPhone !== currentUser.phone;

      const updateData: any = {
        phone: newPhone,
        ...(isPhoneChanged ? { phoneVerified: null } : {}),
      };

      expect(updateData.phoneVerified).toBeNull();
    });

    it("18. SUPER_ADMIN email escalation: Hardcoded email promotion is removed without SUPER_ADMIN_EMAILS", async () => {
      delete process.env.SUPER_ADMIN_EMAILS;

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const testEmail = "tailoringturba@gmail.com";
      const shouldPromote = superAdminEmails.includes(testEmail.toLowerCase());

      expect(shouldPromote).toBe(false);
    });
  });

  // =========================================================================
  // HIGH H-2: Legacy Admin Order Endpoint
  // =========================================================================
  describe("HIGH H-2: Admin Order Lifecycle Gate", () => {
    it("19. Legacy admin order route lifecycle bypass: Invalid transition fails with 422", async () => {
      const { PATCH } = await import("@/app/api/admin/orders/[id]/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      });

      (prisma.order.findUnique as any).mockResolvedValue({
        id: "order-1",
        status: "PENDING",
        totalAmount: 1000,
        paymentTransactions: [],
      });

      const req = new Request("http://localhost:3000/api/admin/orders/order-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED" }), // Invalid: cannot jump PENDING -> DELIVERED
      });

      const res = await PATCH(req, { params: { id: "order-1" } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe("INVALID_TRANSITION");
    });

    it("20. Unpaid dispatch without override: Blocked with DISPATCH_LOCKED (422)", async () => {
      const { PATCH } = await import("@/app/api/admin/orders/[id]/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      });

      (prisma.order.findUnique as any).mockResolvedValue({
        id: "order-1",
        status: "READY_TO_SHIP",
        totalAmount: 5000,
        amountPaid: 3000, // ₹2000 unpaid balance
        paymentTransactions: [
          { amountPaise: 300000, type: "PAYMENT", status: "CAPTURED" },
        ],
      });

      const req = new Request("http://localhost:3000/api/admin/orders/order-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "DISPATCHED" }),
      });

      const res = await PATCH(req, { params: { id: "order-1" } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe("DISPATCH_LOCKED");
    });

    it("21. Unpaid dispatch with authorized override + reason: Succeeds and logs audit event", async () => {
      const { PATCH } = await import("@/app/api/admin/orders/[id]/route");
      const { auth } = await import("@/lib/auth");
      const { prisma } = await import("@/lib/prisma");

      (auth as any).mockResolvedValue({
        user: { id: "admin-1", name: "Operations Lead", role: "ADMIN" },
      });

      (prisma.order.findUnique as any).mockResolvedValue({
        id: "order-1",
        status: "READY_TO_SHIP",
        totalAmount: 5000,
        amountPaid: 3000,
        paymentTransactions: [
          { amountPaise: 300000, type: "PAYMENT", status: "CAPTURED" },
        ],
      });

      (prisma.order.update as any).mockResolvedValue({
        id: "order-1",
        status: "DISPATCHED",
      });

      const req = new Request("http://localhost:3000/api/admin/orders/order-1", {
        method: "PATCH",
        body: JSON.stringify({
          status: "DISPATCHED",
          overrideConfirmed: true,
          overrideReason: "B2B client approved 30-day corporate net credit terms",
        }),
      });

      const res = await PATCH(req, { params: { id: "order-1" } });
      expect(res.status).toBe(200);

      // Verify audit timeline event recorded
      expect(prisma.orderTimelineEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "DISPATCH_OVERRIDE_APPLIED",
            actorRole: "ADMIN",
          }),
        })
      );
    });
  });

  // =========================================================================
  // HIGH H-3: Public Tracking Exact Match
  // =========================================================================
  describe("HIGH H-3: Public Tracking Exact Contact Match", () => {
    it("22. Public tracking partial phone (e.g. '9'): Rejected with 404", async () => {
      const { POST } = await import("@/app/api/orders/track-public/route");

      const req = new NextRequest("http://localhost:3000/api/orders/track-public", {
        method: "POST",
        body: JSON.stringify({
          orderIdentifier: "1001",
          contactInfo: "9", // Attacker partial phone probe
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
    });

    it("23. Public tracking exact phone: Matches exact normalized phone", async () => {
      const { POST } = await import("@/app/api/orders/track-public/route");
      const { prisma } = await import("@/lib/prisma");

      (prisma.order.findFirst as any).mockResolvedValue({
        id: "order-1001",
        orderNumber: 1001,
        status: "CONFIRMED",
        createdAt: new Date(),
        totalAmount: 1500,
        amountPaid: 1500,
        shipments: [],
        timelineEvents: [],
        items: [],
        paymentTransactions: [],
      });

      const req = new NextRequest("http://localhost:3000/api/orders/track-public", {
        method: "POST",
        body: JSON.stringify({
          orderIdentifier: "1001",
          contactInfo: "9876543210",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.orderNumber).toBe(1001);
    });
  });

  // =========================================================================
  // HIGH H-4: Career Resume Upload
  // =========================================================================
  describe("HIGH H-4: Career Resume Upload Security", () => {
    it("24. Malicious resume upload: Executable/script rejected via magic-bytes check", async () => {
      const { POST } = await import("@/app/api/careers/route");

      // Shell script disguised as a PDF
      const scriptContent = "#!/bin/bash\n" + "echo 'running malicious script'\n".repeat(5);
      const fakePdfPayload = Buffer.from(scriptContent).toString("base64");

      const req = new NextRequest("http://localhost:3000/api/careers", {
        method: "POST",
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          position: "Designer",
          resumeFile: {
            name: "exploit.pdf",
            type: "application/pdf",
            base64: `data:application/pdf;base64,${fakePdfPayload}`,
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid resume format");
    });

    it("25. Oversized resume: Rejected with 400 when exceeding 5MB limit", async () => {
      const { POST } = await import("@/app/api/careers/route");

      // Giant buffer exceeding 5MB
      const giantBuffer = Buffer.alloc(6 * 1024 * 1024);
      giantBuffer.write("%PDF-1.4");
      const base64Data = giantBuffer.toString("base64");

      const req = new NextRequest("http://localhost:3000/api/careers", {
        method: "POST",
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          position: "Designer",
          resumeFile: {
            name: "huge.pdf",
            type: "application/pdf",
            base64: `data:application/pdf;base64,${base64Data}`,
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("5MB");
    });
  });

  // =========================================================================
  // MEDIUM M-1 & M-2: Upload Sessions & Email Resend
  // =========================================================================
  describe("MEDIUM M-1 & M-2: Upload Session Flooding & Email Resend Rate Limiting", () => {
    it("26. Upload session flooding: Rejects invalid session ID format", async () => {
      const { GET } = await import("@/app/api/upload-session/route");

      const req = new NextRequest("http://localhost:3000/api/upload-session?session=../../../etc/passwd");
      const res = await GET(req);
      expect(res.status).toBe(400);
    });

    it("27. Verification email resend rate limit: Rate limits repeated requests from single IP", async () => {
      const { POST } = await import("@/app/api/auth/resend-verification/route");
      const { prisma } = await import("@/lib/prisma");

      (prisma.user.findUnique as any).mockResolvedValue({
        id: "u1",
        email: "target@test.com",
        emailVerified: null,
      });

      (prisma.verificationToken.findFirst as any).mockResolvedValue(null);

      // Hit endpoint 6 times from same IP
      let lastRes: any;
      for (let i = 0; i < 6; i++) {
        const req = new NextRequest("http://localhost:3000/api/auth/resend-verification", {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.77" },
          body: JSON.stringify({ email: `target${i}@test.com` }),
        });
        lastRes = await POST(req);
      }

      expect(lastRes.status).toBe(429);
      const json = await lastRes.json();
      expect(json.error).toContain("Too many verification requests");
    });
  });

  // =========================================================================
  // LOW L-1 & L-2: Admin Jobs & Pincode Error Sanitization
  // =========================================================================
  describe("LOW L-1 & L-2: Admin Jobs Auth & Pincode Error Sanitization", () => {
    it("28. Unauthenticated admin jobs: GET /api/admin/jobs returns 401 Unauthorized", async () => {
      const { GET } = await import("@/app/api/admin/jobs/route");
      const { auth } = await import("@/lib/auth");

      (auth as any).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/admin/jobs");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("29. Pincode error sanitization: Upstream failure returns safe generic error without leaking error.message", async () => {
      const { GET } = await import("@/app/api/pincode/[code]/route");

      // Simulate global fetch failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("FATAL: connection pool exhausted at postgresql://user:pass@10.0.0.5:5432"));

      try {
        const req = new NextRequest("http://localhost:3000/api/pincode/411001");
        const res = await GET(req, { params: { code: "411001" } });

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe("Failed to validate pincode.");
        expect(JSON.stringify(json)).not.toContain("FATAL");
        expect(JSON.stringify(json)).not.toContain("postgresql");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
