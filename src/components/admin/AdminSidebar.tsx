"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import styles from "./AdminSidebar.module.css";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Shirt, 
  Layers, 
  Calendar, 
  CreditCard, 
  LogOut,
  ArrowLeft,
  Mail,
  Briefcase,
  ClipboardList,
  Shield
} from "lucide-react";

interface NavGroup {
  groupLabel: string;
  items: {
    icon: typeof LayoutDashboard;
    label: string;
    href: string;
    badge?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    ],
  },
  {
    groupLabel: "COMMERCE",
    items: [
      { icon: Package, label: "Orders", href: "/admin/orders" },
      { icon: Shirt, label: "Products", href: "/admin/products" },
      { icon: Layers, label: "Categories", href: "/admin/categories" },
    ],
  },
  {
    groupLabel: "CUSTOMERS",
    items: [
      { icon: Users, label: "Users", href: "/admin/users" },
      { icon: ClipboardList, label: "Leads", href: "/admin/leads" },
      { icon: Mail, label: "Inquiries", href: "/admin/inquiries" },
    ],
  },
  {
    groupLabel: "OPERATIONS",
    items: [
      { icon: Calendar, label: "Bookings", href: "/admin/bookings" },
      { icon: Briefcase, label: "Jobs", href: "/admin/jobs" },
      { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
    ],
  },
];

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.header}>
        <div className={styles.brandRow}>
          <Link href="/admin" className={styles.logo}>
            TAILORING <span>TURBA</span>
          </Link>
          <div className={styles.envTag}>OPS</div>
        </div>
        <div className={styles.systemSub}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>CONTROL CENTER</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.groupLabel} className={styles.navGroup}>
            <div className={styles.groupLabel}>{group.groupLabel}</div>
            <div className={styles.groupItems}>
              {group.items.map((item) => {
                const isActive = item.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.item} ${isActive ? styles.active : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={styles.iconContainer}>
                      {isActive && (
                        <motion.div
                          layoutId="adminMobileNavActiveGlow"
                          className={styles.mobileActiveGlow}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 27,
                            mass: 0.75,
                          }}
                        />
                      )}
                      <div className={styles.iconWrapper}>
                        <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.85} className={styles.navIcon} />
                      </div>
                    </div>
                    <span className={styles.itemLabel}>{item.label}</span>
                    {isActive && <div className={styles.activeBar} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Admin Identity & Actions */}
      <div className={styles.footer}>
        <div className={styles.adminBadge}>
          <div className={styles.adminIconWrap}>
            <Shield size={14} />
          </div>
          <div className={styles.adminInfo}>
            <div className={styles.adminRole}>
              {role === "SUPER_ADMIN" ? "SUPER ADMIN" : "PLATFORM ADMIN"}
            </div>
            <div className={styles.adminStatus}>AUTHENTICATED</div>
          </div>
        </div>

        <div className={styles.footerLinks}>
          <Link href="/" className={styles.backBtn} title="View Storefront">
            <ArrowLeft size={14} />
            <span>Storefront</span>
          </Link>
          <button 
            className={styles.logout} 
            onClick={() => signOut({ callbackUrl: "/" })}
            title="End Session"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
