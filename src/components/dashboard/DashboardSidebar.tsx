"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./DashboardSidebar.module.css";

const navItems = [
  { icon: "📊", label: "Overview", href: "/dashboard" },
  { icon: "🎨", label: "My Designs", href: "/dashboard/designs" },
  { icon: "📦", label: "My Orders", href: "/dashboard/orders" },
  { icon: "📅", label: "Bookings", href: "/dashboard/bookings" },
  { icon: "💳", label: "Transactions", href: "/dashboard/transactions" },
  { icon: "👤", label: "Profile", href: "/dashboard/profile" },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logo}>
        <span>K</span>raftX
      </Link>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <div className={styles.indicator}></div>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.user}>
          <div className={styles.avatar}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name ?? "User"}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button
          className={styles.logout}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
