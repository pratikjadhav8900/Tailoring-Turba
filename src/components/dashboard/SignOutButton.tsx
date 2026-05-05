"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import styles from "./DashboardSidebar.module.css"; // Reuse existing logout styles if possible, or use ad-hoc

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 24px",
        background: "#fee2e2",
        color: "#991b1b",
        border: "none",
        borderRadius: "8px",
        fontFamily: "var(--font-sans)",
        fontWeight: "600",
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        width: "fit-content"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "#fecaca";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "#fee2e2";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <LogOut size={18} />
      Sign Out of Account
    </button>
  );
}
