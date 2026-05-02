import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Enquiry & Wholesale Quote | Tailoring Turba",
  description: "Request a custom quote for bulk apparel orders. Specialized B2B manufacturing for corporate t-shirts, polo shirts, and uniforms in India. Minimum order 50 units.",
  keywords: ["bulk apparel quote", "wholesale t-shirts India", "corporate uniform supplier", "apparel manufacturing enquiry"],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
