"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, LayoutGrid, User, ShoppingCart } from "lucide-react";
import styles from "./MobileNav.module.css";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";

export default function MobileNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Categories", icon: LayoutGrid, href: "/products" },
    { label: "Account", icon: User, href: session ? "/dashboard" : "/login" },
    { label: "Cart", icon: ShoppingCart, href: "/cart", count: cartCount },
  ];

  return (
    <nav className={styles.mobileNav}>
      <div className={styles.container}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <div className={styles.iconWrapper}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.count !== undefined && item.count > 0 && (
                  <span className={styles.badge}>{item.count}</span>
                )}
              </div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
