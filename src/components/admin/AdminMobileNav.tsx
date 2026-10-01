"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Package, 
  Shirt, 
  ClipboardList, 
  MoreHorizontal,
  Layers,
  Users,
  Mail,
  Calendar,
  Briefcase,
  CreditCard,
  ArrowLeft,
  LogOut,
  X
} from "lucide-react";
import styles from "./AdminMobileNav.module.css";

type AdminPrimaryTab = "dashboard" | "orders" | "products" | "leads" | "more";

const MORE_ROUTES = [
  "/admin/categories",
  "/admin/users",
  "/admin/inquiries",
  "/admin/bookings",
  "/admin/jobs",
  "/admin/transactions",
];

function isMoreRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return MORE_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function getActiveAdminTab(pathname: string | null, isMoreOpen: boolean): AdminPrimaryTab {
  if (isMoreOpen) return "more";
  if (!pathname) return "dashboard";

  if (pathname === "/admin") {
    return "dashboard";
  }

  if (pathname === "/admin/orders" || pathname.startsWith("/admin/orders/")) {
    return "orders";
  }

  if (pathname === "/admin/products" || pathname.startsWith("/admin/products/")) {
    return "products";
  }

  if (pathname === "/admin/leads" || pathname.startsWith("/admin/leads/")) {
    return "leads";
  }

  if (isMoreRoute(pathname)) {
    return "more";
  }

  return "dashboard";
}

export default function AdminMobileNav({ role }: { role?: string }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Handle escape key and lock body scroll
  const handleCloseMore = useCallback(() => {
    setIsMoreOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMoreOpen) {
        handleCloseMore();
      }
    };

    if (isMoreOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen, handleCloseMore]);

  const activeTab = useMemo(() => getActiveAdminTab(pathname, isMoreOpen), [pathname, isMoreOpen]);

  if (!mounted) return null;

  const moreItems = [
    {
      label: "Categories",
      desc: "Hierarchy & styles",
      href: "/admin/categories",
      icon: Layers,
    },
    {
      label: "Users & B2B",
      desc: "Clients & accounts",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Inquiries",
      desc: "Customer messages",
      href: "/admin/inquiries",
      icon: Mail,
    },
    {
      label: "Bookings",
      desc: "Showroom visits",
      href: "/admin/bookings",
      icon: Calendar,
    },
    {
      label: "Jobs",
      desc: "Careers & applications",
      href: "/admin/jobs",
      icon: Briefcase,
    },
    {
      label: "Transactions",
      desc: "Ledger & payouts",
      href: "/admin/transactions",
      icon: CreditCard,
    },
  ];

  return (
    <>
      {/* ─── FLOATING 5-ITEM BOTTOM NAVIGATION BAR ─── */}
      <nav className={styles.mobileNav} aria-label="Super Admin Mobile Navigation">
        <div className={styles.container}>
          
          {/* 1. Dashboard */}
          <Link
            href="/admin"
            className={`${styles.navItem} ${activeTab === "dashboard" ? styles.active : ""}`}
            aria-current={activeTab === "dashboard" ? "page" : undefined}
            aria-label="Dashboard"
            onClick={handleCloseMore}
          >
            <div className={styles.pillContainer}>
              {activeTab === "dashboard" && <div className={styles.activePill} aria-hidden="true" />}
              <div className={styles.iconWrapper}>
                <LayoutDashboard
                  size={20}
                  strokeWidth={activeTab === "dashboard" ? 2.25 : 1.75}
                  className={styles.icon}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.label}>Dashboard</span>
            </div>
          </Link>

          {/* 2. Orders */}
          <Link
            href="/admin/orders"
            className={`${styles.navItem} ${activeTab === "orders" ? styles.active : ""}`}
            aria-current={activeTab === "orders" ? "page" : undefined}
            aria-label="Orders"
            onClick={handleCloseMore}
          >
            <div className={styles.pillContainer}>
              {activeTab === "orders" && <div className={styles.activePill} aria-hidden="true" />}
              <div className={styles.iconWrapper}>
                <Package
                  size={20}
                  strokeWidth={activeTab === "orders" ? 2.25 : 1.75}
                  className={styles.icon}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.label}>Orders</span>
            </div>
          </Link>

          {/* 3. Products */}
          <Link
            href="/admin/products"
            className={`${styles.navItem} ${activeTab === "products" ? styles.active : ""}`}
            aria-current={activeTab === "products" ? "page" : undefined}
            aria-label="Products"
            onClick={handleCloseMore}
          >
            <div className={styles.pillContainer}>
              {activeTab === "products" && <div className={styles.activePill} aria-hidden="true" />}
              <div className={styles.iconWrapper}>
                <Shirt
                  size={20}
                  strokeWidth={activeTab === "products" ? 2.25 : 1.75}
                  className={styles.icon}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.label}>Products</span>
            </div>
          </Link>

          {/* 4. Leads */}
          <Link
            href="/admin/leads"
            className={`${styles.navItem} ${activeTab === "leads" ? styles.active : ""}`}
            aria-current={activeTab === "leads" ? "page" : undefined}
            aria-label="Leads"
            onClick={handleCloseMore}
          >
            <div className={styles.pillContainer}>
              {activeTab === "leads" && <div className={styles.activePill} aria-hidden="true" />}
              <div className={styles.iconWrapper}>
                <ClipboardList
                  size={20}
                  strokeWidth={activeTab === "leads" ? 2.25 : 1.75}
                  className={styles.icon}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.label}>Leads</span>
            </div>
          </Link>

          {/* 5. More (Trigger for Bottom Sheet) */}
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === "more" ? styles.active : ""}`}
            aria-expanded={isMoreOpen}
            aria-controls="admin-more-sheet"
            aria-label="More Management Operations"
            onClick={() => setIsMoreOpen(prev => !prev)}
          >
            <div className={styles.pillContainer}>
              {activeTab === "more" && <div className={styles.activePill} aria-hidden="true" />}
              <div className={styles.iconWrapper}>
                <MoreHorizontal
                  size={20}
                  strokeWidth={activeTab === "more" ? 2.25 : 1.75}
                  className={styles.icon}
                  aria-hidden="true"
                />
              </div>
              <span className={styles.label}>More</span>
            </div>
          </button>

        </div>
      </nav>

      {/* ─── MORE BOTTOM SHEET & BACKDROP OVERLAY ─── */}
      <div 
        className={`${styles.overlay} ${isMoreOpen ? styles.overlayOpen : ""}`} 
        onClick={handleCloseMore}
        aria-hidden={!isMoreOpen}
      />

      <div 
        id="admin-more-sheet"
        className={`${styles.sheet} ${isMoreOpen ? styles.sheetOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Operations Menu"
      >
        <div className={styles.dragHandle} />

        <div className={styles.sheetHeader}>
          <div>
            <div className={styles.sheetBadge}>SUPER ADMIN PORTAL</div>
            <h2 className={styles.sheetTitle}>More Operations</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleCloseMore}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Grid of the remaining 6 destinations */}
        <div className={styles.moreGrid}>
          {moreItems.map((item) => {
            const isItemActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const IconComp = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.gridCard} ${isItemActive ? styles.gridCardActive : ""}`}
                onClick={handleCloseMore}
              >
                <div className={styles.cardIconRow}>
                  <div className={styles.cardIconWrap}>
                    <IconComp size={18} strokeWidth={isItemActive ? 2.2 : 1.8} />
                  </div>
                  {isItemActive && <span className={styles.activeDot} />}
                </div>
                <div>
                  <div className={styles.cardLabel}>{item.label}</div>
                  <div className={styles.cardDesc}>{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Utilities Footer */}
        <div className={styles.sheetFooter}>
          <Link
            href="/"
            className={styles.footerBtn}
            onClick={handleCloseMore}
          >
            <ArrowLeft size={15} />
            <span>Storefront</span>
          </Link>
          <button
            type="button"
            className={`${styles.footerBtn} ${styles.footerBtnLogout}`}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
