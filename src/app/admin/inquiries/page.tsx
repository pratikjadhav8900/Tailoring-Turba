export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import InquiryTable from "@/components/admin/InquiryTable";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    where: {
      NOT: {
        companyName: "Career Application",
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: "clamp(16px, 5vw, 40px)" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>Customer Inquiries</h1>
        <p style={{ color: "#64748b", marginTop: "4px" }}>Manage and track wholesale quote requests.</p>
      </div>

      <InquiryTable initialInquiries={JSON.parse(JSON.stringify(inquiries))} />
    </div>
  );
}

