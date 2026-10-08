"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Kanban,
  Scissors,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { OpsEmployee } from "@/types/ops";
import { signOut } from "next-auth/react";

interface OpsSidebarProps {
  employee?: OpsEmployee | null;
  onCloseMobile?: () => void;
}

const OpsSidebarInner: React.FC<OpsSidebarProps> = ({
  employee,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isKanban = pathname === "/ops/orders" && searchParams.get("view") === "kanban";

  const navItems = [
    {
      label: "Dashboard",
      href: "/ops",
      icon: <LayoutDashboard className="w-4 h-4" />,
      isActive: pathname === "/ops",
    },
    {
      label: "Orders List",
      href: "/ops/orders",
      icon: <ClipboardList className="w-4 h-4" />,
      isActive: pathname === "/ops/orders" && !isKanban,
    },
    {
      label: "Production Board",
      href: "/ops/orders?view=kanban",
      icon: <Kanban className="w-4 h-4" />,
      isActive: isKanban,
    },
  ];

  return (
    <aside className="w-64 bg-[#0c0e14] border-r border-[#1e2230] flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#1e2230] flex items-center justify-between">
        <Link
          href="/ops"
          className="flex items-center gap-2.5 text-slate-100 hover:text-white"
          onClick={onCloseMobile}
        >
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-xs">
            <Scissors className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-xs uppercase text-slate-100 font-mono">
              Tailoring Turba
            </span>
            <span className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">
              Ops Control
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Manufacturing
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              item.isActive
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Employee Identity Footer */}
      <div className="p-3 border-t border-[#1e2230] bg-[#090a0f]/60">
        <div className="p-2.5 rounded bg-[#10121a] border border-[#1e2230] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
              {employee?.name ? employee.name.charAt(0).toUpperCase() : "E"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1">
                {employee?.name || "Employee"}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="text-amber-400 font-mono">
                  {employee?.employeeCode || "EMP"}
                </span>
                <span>•</span>
                <span className="truncate">{employee?.roleTitle || "Staff"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/ops/login" })}
            title="Sign out of Ops"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/[0.04] rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const OpsSidebar: React.FC<OpsSidebarProps> = (props) => {
  return (
    <React.Suspense fallback={<aside className="w-64 bg-[#0c0e14] border-r border-[#1e2230]" />}>
      <OpsSidebarInner {...props} />
    </React.Suspense>
  );
};
