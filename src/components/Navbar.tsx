"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, User, ShoppingCart, ChevronDown, LayoutDashboard, ShieldCheck, Heart } from "lucide-react";
import styles from "./Navbar.module.css";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSession } from "next-auth/react";

// Assuming we want a "transparent" prop to still exist so we don't break page.tsx, 
// but we will ignore it in the CSS to make the navbar solid as agreed.
export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { data: session, status } = useSession();
  const wishlistCount = wishlistItems.length;
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsAdmin(session?.user?.role === "ADMIN");
  }, [session]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.nav}>
        {/* Hamburger Menu Toggle (Mobile only) */}
        <button 
          className={styles.mobileMenuToggle} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <div className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Left: Logo */}
        <Link href="/" className={styles.logo}>
          <Image 
            src="/logo.svg" 
            alt="Tailoring Turba" 
            width={180} 
            height={50} 
            style={{ objectFit: "contain" }} 
            priority 
          />
        </Link>

        {/* Center: Nav Links */}
        <div className={`${styles.leftLinks} ${mobileMenuOpen ? styles.mobileOpen : ""}`}>
          <div className={styles.dropdownContainer}>
            <Link href="/products" className={styles.navLink}>
              Products <ChevronDown size={14} />
            </Link>
            
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Men</span>
                <Link href="/products?category=Crewnecks" className={styles.dropdownItem}>Crewnecks</Link>
                <Link href="/products?category=Hoodies" className={styles.dropdownItem}>Hoodies</Link>
                <Link href="/products?category=Jackets" className={styles.dropdownItem}>Jackets</Link>
                <Link href="/products?category=Polos" className={styles.dropdownItem}>Polos</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Women</span>
                <Link href="/products?category=Crop Tops" className={styles.dropdownItem}>Crop Tops</Link>
                <Link href="/products?category=Oversized" className={styles.dropdownItem}>Oversized</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Kids</span>
                <Link href="/products?category=T-Shirts" className={styles.dropdownItem}>T-Shirts</Link>
                <Link href="/products?category=Uniforms" className={styles.dropdownItem}>Uniforms</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <Link href="/products" className={styles.viewAll}>View All Products &rarr;</Link>
            </div>
          </div>
          
          <Link href="/about" className={styles.navLink}>Our Story</Link>
          <Link href="/booking" className={styles.navLink}>Book a Visit</Link>
        </div>

        {/* Right: Icons */}
        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Search">
            <Search size={22} />
          </button>

          {isAdmin && (
            <Link href="/admin" className={styles.iconBtn} aria-label="Admin Panel" title="Admin Panel">
              <ShieldCheck size={22} color="var(--tth-olive-dark)" />
            </Link>
          )}

          <Link href={session ? "/dashboard" : "/login"} className={styles.iconBtn} aria-label={session ? "Dashboard" : "Sign In"}>
            <User size={22} />
          </Link>

          <Link href="/wishlist" className={styles.iconBtn} aria-label="Shortlist">
            <Heart size={22} fill={wishlistCount > 0 ? "#ef4444" : "none"} color={wishlistCount > 0 ? "#ef4444" : "currentColor"} />
            {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
          </Link>

          <Link href="/cart" className={styles.iconBtn} aria-label="Cart">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
