"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Search, User, ShoppingCart, ChevronDown, LayoutDashboard, ShieldCheck, Heart } from "lucide-react";
import styles from "./Navbar.module.css";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useSession } from "next-auth/react";

// Assuming we want a "transparent" prop to still exist so we don't break page.tsx, 
// but we will ignore it in the CSS to make the navbar solid as agreed.
export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { data: session, status } = useSession();
  const wishlistCount = wishlistItems.length;
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const role = (session?.user as any)?.role;
      setIsAdmin(role === "ADMIN" || role === "SUPER_ADMIN");
    }
  }, [session, mounted]);

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
            src="/brand-logo.png" 
            alt="Tailoring Turba" 
            width={200} 
            height={70} 
            style={{ objectFit: "contain" }} 
            priority 
          />
        </Link>

        {/* Center: Nav Links */}
        <div className={`${styles.leftLinks} ${mobileMenuOpen ? styles.mobileOpen : ""}`}>
          <div className={styles.dropdownContainer}>
            <Link href="/products" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
              Products <ChevronDown size={14} />
            </Link>
            
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Men</span>
                <Link href="/products?category=Crewnecks" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Crewnecks</Link>
                <Link href="/products?category=Hoodies" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Hoodies</Link>
                <Link href="/products?category=Jackets" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Jackets</Link>
                <Link href="/products?category=Polos" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Polos</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Women</span>
                <Link href="/products?category=Crop Tops" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Crop Tops</Link>
                <Link href="/products?category=Oversized" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Oversized</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <div className={styles.dropdownGroup}>
                <span className={styles.dropdownGroupTitle}>For Kids</span>
                <Link href="/products?category=T-Shirts" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>T-Shirts</Link>
                <Link href="/products?category=Uniforms" className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>Uniforms</Link>
              </div>
              <div className={styles.dropdownDivider} />
              <Link href="/products" className={styles.viewAll} onClick={() => setMobileMenuOpen(false)}>View All Products &rarr;</Link>
            </div>
          </div>
          
          <Link href="/about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Our Story</Link>
          <Link href="/booking" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Book a Visit</Link>
          <Link href="/tt-luxe" className={`${styles.navLink} ${styles.luxeLink}`} onClick={() => setMobileMenuOpen(false)}>TT Luxe ✨</Link>
        </div>

        {/* Right: Icons */}
        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Search">
            <Search size={22} />
          </button>

          {mounted && isAdmin && (
            <Link href="/admin" className={styles.iconBtn} aria-label="Admin Panel" title="Admin Panel">
              <ShieldCheck size={22} color="var(--tth-olive-dark)" />
            </Link>
          )}

          {mounted && (
            <>
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
            </>
          )}

          {!mounted && (
            <>
              <div className={styles.iconBtn}><User size={22} /></div>
              <div className={styles.iconBtn}><Heart size={22} /></div>
              <div className={styles.iconBtn}><ShoppingCart size={22} /></div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
