"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Home, Shirt, ClipboardList, ShoppingCart, User } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./MobileNav.module.css";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";

type NavTabId = "home" | "products" | "orders" | "cart" | "account";

function getActiveTab(pathname: string | null): NavTabId | null {
  if (!pathname) return "home";

  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/products" || pathname.startsWith("/products/")) {
    return "products";
  }

  // Check orders before generic dashboard check so /dashboard/orders highlights Orders
  if (
    pathname === "/track-order" ||
    pathname.startsWith("/track-order/") ||
    pathname === "/dashboard/orders" ||
    pathname.startsWith("/dashboard/orders/")
  ) {
    return "orders";
  }

  if (
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/")
  ) {
    return "cart";
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
    pathname.startsWith("/profile/") ||
    pathname === "/wishlist" ||
    pathname.startsWith("/wishlist/")
  ) {
    return "account";
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
    { id: "products", label: "Products", icon: Shirt, href: "/products" },
    { id: "orders", label: "Orders", icon: ClipboardList, href: session ? "/dashboard/orders" : "/track-order" },
    { id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart", count: cartCount },
    { id: "account", label: "Account", icon: User, href: session ? "/dashboard" : "/login" },
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
              <div className={styles.pillContainer}>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    className={styles.activePill}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                      mass: 0.65,
                    }}
                  />
                )}
                <div className={styles.iconWrapper}>
                  <IconComponent
                    size={20}
                    strokeWidth={isActive ? 2.25 : 1.75}
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
                <span className={styles.label}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
