"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Home, LayoutGrid, User, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./MobileNav.module.css";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";

type NavTabId = "home" | "categories" | "account" | "cart";

function getActiveTab(pathname: string | null): NavTabId | null {
  if (!pathname) return "home";

  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/products" || pathname.startsWith("/products/")) {
    return "categories";
  }

  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/")
  ) {
    return "account";
  }

  if (
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/")
  ) {
    return "cart";
  }

  return null;
}

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Synchronize active tab from the current pathname
  const routeTab = useMemo(() => getActiveTab(pathname), [pathname]);
  const [activeTab, setActiveTab] = useState<NavTabId | null>(routeTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  if (!mounted) return null;

  const navItems: {
    id: NavTabId;
    label: string;
    icon: typeof Home;
    href: string;
    count?: number;
  }[] = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "categories", label: "Categories", icon: LayoutGrid, href: "/products" },
    { id: "account", label: "Account", icon: User, href: session ? "/dashboard" : "/login" },
    { id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart", count: cartCount },
  ];

  return (
    <nav className={styles.mobileNav} aria-label="Mobile Navigation" role="navigation">
      <div className={styles.container}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              onClick={() => setActiveTab(item.id)}
            >
              <div className={styles.iconContainer}>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActiveGlow"
                    className={styles.activeGlow}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 27,
                      mass: 0.75,
                    }}
                  />
                )}
                <div className={styles.iconWrapper}>
                  <IconComponent
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.85}
                    fill={
                      isActive
                        ? item.id === "home" || item.id === "categories"
                          ? "currentColor"
                          : "none"
                        : "none"
                    }
                    className={styles.icon}
                    aria-hidden="true"
                  />
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={styles.badge}
                      aria-label={`${item.count} items in cart`}
                    >
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </div>
              </div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
