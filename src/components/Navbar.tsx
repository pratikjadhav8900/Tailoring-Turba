"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import styles from "./Navbar.module.css";
import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.nav}`}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.svg" alt="Tailoring Turba" width={220} height={40} style={{ objectFit: "contain" }} priority />
        </Link>
        
        <div className={styles.links}>
          <Link href="/create">Design Studio</Link>
          <Link href="/products">Products</Link>
          <Link href="/booking">Book Showroom</Link>
        </div>

        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartBtn}>
            <ShoppingCart size={18} />
            <span className={styles.cartLabel}>My Cart</span>
            {isMounted && cartCount > 0 ? <span className={styles.cartBadge}>{cartCount}</span> : null}
          </Link>
          
          {session ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>Login</Link>
              <Link href="/register" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
