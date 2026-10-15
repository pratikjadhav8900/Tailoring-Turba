import React from "react";
import "@/styles/ops.theme.css";

export const metadata = {
  title: "Turba Ops — Production & Order Operations",
  description: "Internal operations control for Tailoring Turba factory team",
};

export default function RootOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="ops-root w-full min-h-screen bg-[#FDFDFE] text-[#111827]">{children}</div>;
}
