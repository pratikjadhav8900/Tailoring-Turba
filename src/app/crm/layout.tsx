import React from "react";
import "@/styles/crm.theme.css";

export const metadata = {
  title: "Turba CRM — Sales Pipeline",
  description: "Lead management for the Tailoring Turba sales team",
};

export default function RootCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="crm-root w-full min-h-screen bg-[#FDFDFE] text-[#111827]">{children}</div>;
}
