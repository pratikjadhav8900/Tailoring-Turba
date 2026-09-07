import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST as feedbackPost } from "@/app/api/feedback/route";
import { GET as userAssetGet } from "@/app/api/user-assets/[id]/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
    orderFeedback: {
      create: vi.fn(),
    },
    userAsset: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
  },
  withRetry: vi.fn((fn: any) => fn()),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

describe("Phase 2 Security Remediation: Privacy, IDOR & Asset Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // H-1: Feedback IDOR Invariants
  // -------------------------------------------------------------------------
  describe("H-1: Feedback Submission IDOR Prevention", () => {
    const validFeedbackBody = {
      orderId: "order-123",
      serviceOverall: 5,
      serviceProfessionalism: 5,
      serviceTimeline: 5,
      easeOrdering: 5,
      easeCommunication: 5,
      easeProcess: 5,
      fabricQuality: 5,
      fabricExpectations: 5,
      fabricStitching: 5,
      printingLogo: 5,
      printingAccuracy: 5,
      comment: "Excellent uniforms!",
    };

    it("1. Unauthenticated request to submit feedback is rejected with 401", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validFeedbackBody),
      });

      const res = await feedbackPost(req as any);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized.");
    });

    it("2. Cross-user IDOR attempt (Customer A submitting for Customer B's order) is rejected with 403", async () => {
      // Authenticated as Customer A
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "customer-a-id", role: "USER", email: "a@example.com" },
      } as any);

      // Order belongs to Customer B
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: "order-123",
        userId: "customer-b-id",
        status: "DELIVERED",
        feedback: null,
      } as any);

      const req = new Request("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validFeedbackBody),
      });

      const res = await feedbackPost(req as any);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toBe("Forbidden.");
      expect(prisma.orderFeedback.create).not.toHaveBeenCalled();
    });

    it("3. Authorized customer can submit feedback for their own delivered order", async () => {
      // Authenticated as Customer A
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "customer-a-id", role: "USER", email: "a@example.com" },
      } as any);

      // Order belongs to Customer A
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: "order-123",
        userId: "customer-a-id",
        status: "DELIVERED",
        feedback: null,
      } as any);

      vi.mocked(prisma.orderFeedback.create).mockResolvedValueOnce({} as any);

      const req = new Request("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validFeedbackBody),
      });

      const res = await feedbackPost(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.orderFeedback.create).toHaveBeenCalled();
    });

    it("4. Admin user is authorized to submit/record feedback on behalf of order fulfillment", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "admin-id", role: "ADMIN", email: "admin@tailoringturba.com" },
      } as any);

      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: "order-123",
        userId: "customer-b-id",
        status: "DELIVERED",
        feedback: null,
      } as any);

      vi.mocked(prisma.orderFeedback.create).mockResolvedValueOnce({} as any);

      const req = new Request("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validFeedbackBody),
      });

      const res = await feedbackPost(req as any);
      expect(res.status).toBe(200);
      expect(prisma.orderFeedback.create).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // M-1: Private Customer Artwork Access Invariants
  // -------------------------------------------------------------------------
  describe("M-1: Private Customer Artwork & Logo Access Control", () => {
    it("5. Unauthenticated user cannot access private customer artwork", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost:3000/api/user-assets/asset-123");
      const res = await userAssetGet(req as any, { params: { id: "asset-123" } });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("6. Customer A cannot access Customer B's artwork by asset ID enumeration", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "customer-a-id", role: "USER", email: "a@example.com" },
      } as any);

      // Asset belongs to Customer B
      vi.mocked(prisma.userAsset.findUnique).mockResolvedValueOnce({
        id: "asset-b",
        userId: "customer-b-id",
        url: "https://res.cloudinary.com/demo/image/upload/sample.png",
      } as any);

      const req = new Request("http://localhost:3000/api/user-assets/asset-b");
      const res = await userAssetGet(req as any, { params: { id: "asset-b" } });

      // Must fail closed with 404/403 to prevent enumeration
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/denied|not found/i);
    });

    it("7. Authorized customer can access their own artwork", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "customer-a-id", role: "USER", email: "a@example.com" },
      } as any);

      // Asset belongs to Customer A
      vi.mocked(prisma.userAsset.findUnique).mockResolvedValueOnce({
        id: "asset-a",
        userId: "customer-a-id",
        url: "https://res.cloudinary.com/demo/image/upload/customer_logo.png",
      } as any);

      const req = new Request("http://localhost:3000/api/user-assets/asset-a");
      const res = await userAssetGet(req as any, { params: { id: "asset-a" } });

      // Cloudinary asset redirects to authorized signed/direct target URL
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("https://res.cloudinary.com/demo/image/upload/customer_logo.png");
    });

    it("8. Admin can access customer artwork required for production fulfillment", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "admin-id", role: "ADMIN", email: "admin@tailoringturba.com" },
      } as any);

      // Asset belongs to Customer B
      vi.mocked(prisma.userAsset.findUnique).mockResolvedValueOnce({
        id: "asset-b",
        userId: "customer-b-id",
        url: "https://res.cloudinary.com/demo/image/upload/b_corp_logo.png",
      } as any);

      const req = new Request("http://localhost:3000/api/user-assets/asset-b");
      const res = await userAssetGet(req as any, { params: { id: "asset-b" } });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("https://res.cloudinary.com/demo/image/upload/b_corp_logo.png");
    });

    it("9. Random non-existent asset ID fails closed without leaking database structure", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "customer-a-id", role: "USER" },
      } as any);

      vi.mocked(prisma.userAsset.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.orderItem.findFirst).mockResolvedValueOnce(null);

      const req = new Request("http://localhost:3000/api/user-assets/nonexistent-id-999");
      const res = await userAssetGet(req as any, { params: { id: "nonexistent-id-999" } });

      expect(res.status).toBe(404);
    });
  });
});
