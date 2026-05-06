"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  Home
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Package, label: "Orders", href: "/admin/orders" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shirt, label: "Products", href: "/admin/products" },
  { icon: Layers, label: "Categories", href: "/admin/categories" },
  { icon: Calendar, label: "Bookings", href: "/admin/bookings" },
  { icon: Mail, label: "Inquiries", href: "/admin/inquiries" },
  { icon: CreditCard, label: "Transactions", href: "/admin/transactions" },
];

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>
          Tailoring <span>Turba</span>
        </Link>
        <div className={styles.roleChip}>
          {role === "SUPER_ADMIN" ? "Super Admin" : "Platform Admin"}
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(Item => {
          const isActive = Item.href === "/" 
            ? pathname === "/" 
            : Item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname.startsWith(Item.href);
          return (
            <Link key={Item.href} href={Item.href} className={`${styles.item} ${isActive ? styles.active : ""}`}>
              <div className={styles.iconWrapper}>
                <Item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span>{Item.label}</span>
              {isActive && <div className={styles.indicator} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Site
        </Link>
        <button className={styles.logout} onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
