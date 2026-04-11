"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { icon: "📊", label: "Dashboard", href: "/admin" },
  { icon: "📦", label: "Orders", href: "/admin/orders" },
  { icon: "👥", label: "Users", href: "/admin/users" },
  { icon: "👕", label: "Products", href: "/admin/products" },
  { icon: "🗂️", label: "Categories", href: "/admin/categories" },
  { icon: "📅", label: "Bookings", href: "/admin/bookings" },
  { icon: "💳", label: "Transactions", href: "/admin/transactions" },
];

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}><span>K</span>raftX <span className={styles.badge}>ADMIN</span></div>
      <div className={styles.roleChip}>{role === "SUPER_ADMIN" ? "⭐ Super Admin" : "🔑 Admin"}</div>
      <nav className={styles.nav}>
        {navItems.map(item => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`${styles.item} ${isActive ? styles.active : ""}`}>
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div className={styles.indicator}></div>}
            </Link>
          );
        })}
      </nav>
      <button className={styles.logout} onClick={() => signOut({ callbackUrl: "/" })}>🚪 Sign Out</button>
    </aside>
  );
}
