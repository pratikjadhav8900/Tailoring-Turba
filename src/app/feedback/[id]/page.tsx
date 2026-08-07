export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FeedbackForm from "./FeedbackForm";
import Navbar from "@/components/layout/Navbar";

export default async function FeedbackPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      feedback: true,
    },
  });

  if (!order) {
    return notFound();
  }

  // Check if order is delivered
  if (order.status !== "DELIVERED") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--tth-offwhite, #f8fafc)" }}>
        <Navbar />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans, sans-serif)", padding: "40px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
          <h1 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "12px", color: "#000", textAlign: "center" }}>Access Restricted</h1>
          <p style={{ color: "#6b6b65", textAlign: "center", maxWidth: "420px", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Feedback can only be submitted once the order has been successfully delivered. Currently, this order is in <strong>{order.status}</strong> status.
          </p>
        </div>
      </div>
    );
  }

  // Check if feedback already submitted
  if (order.feedback) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--tth-offwhite, #f8fafc)" }}>
        <Navbar />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans, sans-serif)", padding: "40px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✨</div>
          <h1 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "2rem", fontWeight: 400, marginBottom: "12px", color: "#000", textAlign: "center" }}>Feedback Already Received</h1>
          <p style={{ color: "#6b6b65", textAlign: "center", maxWidth: "420px", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Thank you! You have already shared your feedback for Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}. We appreciate your response!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--tth-offwhite, #f8fafc)" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FeedbackForm orderId={order.id} orderNumber={order.orderNumber ?? undefined} customerName={order.user?.name || "Customer"} />
      </div>
    </div>
  );
}
