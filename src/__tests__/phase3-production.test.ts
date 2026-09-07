import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as uploadPost } from "@/app/api/upload/route";
import { POST as contactPost } from "@/app/api/contact/route";
import { POST as bookingPost } from "@/app/api/bookings/route";
import { GET as trackOrderGet } from "@/app/api/orders/[id]/track/route";
import { POST as shippingBookPost } from "@/app/api/shipping/book/route";
import { checkRateLimit, resetRateLimitStores } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn() },
    inquiry: { create: vi.fn() },
    booking: { create: vi.fn() },
    order: { findUnique: vi.fn() },
    userAsset: { create: vi.fn() },
  },
  withRetry: vi.fn((fn: any) => fn()),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendMail: vi.fn().mockResolvedValue({ success: true }),
  sendOperationsBookingAlert: vi.fn().mockResolvedValue({ success: true }),
  sendCustomerBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Phase 3 Security Remediation: Production Readiness & Defense In Depth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStores();
  });

  // -------------------------------------------------------------------------
  // H-1: File Upload Security
  // -------------------------------------------------------------------------
  describe("H-1: File Upload Security Controls", () => {
    it("1. Rejects upload exceeding 15MB size limit", async () => {
      // 16MB simulated file
      const largeBuffer = new Uint8Array(16 * 1024 * 1024);
      const file = new File([largeBuffer], "large_design.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);

      const req = new Request("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/exceeds the 15MB limit/i);
    });

    it("2. Rejects disallowed file types and fake extensions (e.g., text/html renamed as .png)", async () => {
      // HTML payload with .png extension
      const fakeBuffer = new TextEncoder().encode("<html><script>alert(1)</script></html>");
      const file = new File([fakeBuffer], "malicious.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);

      const req = new Request("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/Invalid or unsupported file format/i);
    });

    it("3. Accepts valid PNG with genuine magic byte signature", async () => {
      // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const file = new File([validPngBytes], "valid_logo.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);

      const req = new Request("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.url).toBeDefined();
      expect(data.public_id).toBeDefined();
      // Verifies fallback does not expose direct public static file URL
      expect(data.url).not.toMatch(/^\/uploads\//);
    });

    it("4. Upload rate limiting triggers after exceeding quota", async () => {
      const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

      // Execute 20 uploads (the limit)
      for (let i = 0; i < 20; i++) {
        checkRateLimit("upload_ip_192.168.1.50", 20, 10 * 60 * 1000);
      }

      const file = new File([validPngBytes], "valid_logo.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      const req = new Request("http://localhost:3000/api/upload", {
        method: "POST",
        headers: { "x-forwarded-for": "192.168.1.50" },
        body: formData,
      });

      const res = await uploadPost(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/too many upload requests/i);
    });
  });

  // -------------------------------------------------------------------------
  // H-3: Login, Contact & Booking Rate Limiting
  // -------------------------------------------------------------------------
  describe("H-3: Login, Contact & Booking Abuse Protection", () => {
    it("5. Contact route rate limiting triggers on repeated submissions from same IP", async () => {
      // Max 5 submissions per 10 minutes
      for (let i = 0; i < 5; i++) {
        checkRateLimit("contact_ip_10.0.0.1", 5, 10 * 60 * 1000);
      }

      const req = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.1",
        },
        body: JSON.stringify({
          name: "Spam Bot",
          email: "spam@example.com",
          phone: "9876543210",
          message: "Buy cheap products now",
        }),
      });

      const res = await contactPost(req as any);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/too many contact requests/i);
    });

    it("6. Bookings route rate limiting triggers on repeated attempts", async () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("booking_ip_10.0.0.2", 5, 15 * 60 * 1000);
      }

      const req = new Request("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.2",
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          timeSlot: "11:00 AM - 12:00 PM",
        }),
      });

      const res = await bookingPost(req as any);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/too many booking attempts/i);
    });

    it("7. Login rate limiting blocks credential stuffing after 10 failed attempts", () => {
      const email = "victim@example.com";
      for (let i = 0; i < 10; i++) {
        checkRateLimit(`login_attempt_${email}`, 10, 15 * 60 * 1000);
      }

      const eleventhAttempt = checkRateLimit(`login_attempt_${email}`, 10, 15 * 60 * 1000);
      expect(eleventhAttempt.allowed).toBe(false);
      expect(eleventhAttempt.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // L-1: Error Response Sanitization
  // -------------------------------------------------------------------------
  describe("L-1: Server Error Sanitization", () => {
    it("8. Order tracking 500 error does not leak raw database exception details", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", role: "USER" },
      } as any);

      // Simulate internal database crash
      vi.mocked(prisma.order.findUnique).mockRejectedValueOnce(
        new Error("FATAL: connection to PostgreSQL at 10.0.4.1 failed (password auth)")
      );

      const req = new Request("http://localhost:3000/api/orders/order-1/track");
      const res = await trackOrderGet(req as any, { params: { id: "order-1" } });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("Failed to retrieve tracking details. Please try again.");
      expect(data.error).not.toContain("PostgreSQL");
      expect(data.error).not.toContain("10.0.4.1");
    });

    it("9. Shipping book 500 error returns generic safe error", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      } as any);

      vi.mocked(prisma.order.findUnique).mockRejectedValueOnce(
        new Error("SSL syscall error: Connection reset by peer")
      );

      const req = new Request("http://localhost:3000/api/shipping/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "order-1", masterCustomOrderId: "ord-1", courierId: 1 }),
      });

      const res = await shippingBookPost(req as any);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("Failed to book shipment with carrier. Please check details and try again.");
      expect(data.error).not.toContain("SSL syscall error");
    });
  });
});
