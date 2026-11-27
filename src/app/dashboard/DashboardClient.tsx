"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { 
  Package, 
  Sparkles, 
  Heart, 
  CalendarCheck, 
  MapPin, 
  User, 
  Building2, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  Shirt, 
  Clock, 
  Mail, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Trash2, 
  LogOut,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import styles from "./page.module.css";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  mockupUrl: string | null;
  product: {
    name: string;
    images: string[];
    type: string | null;
  };
  design?: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string | Date;
  orderNumber: number;
  productionStage?: string | null;
  items: OrderItem[];
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
}

interface Design {
  id: string;
  name: string;
  createdAt: string | Date;
  imageUrl: string | null;
  product: {
    name: string;
    images: string[];
    type: string | null;
  } | null;
}

interface Booking {
  id: string;
  date: string | Date;
  timeSlot: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  minOrderQuantity: number;
  images: string[];
  badge: string | null;
  type: string | null;
}

interface DashboardClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    image?: string | null;
    companyName?: string | null;
    gstNumber?: string | null;
    isB2BApproved?: boolean;
    Address?: Array<{
      id: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      isDefault: boolean;
    }>;
  };
  orders: Order[];
  designs: Design[];
  bookings: Booking[];
  recommendedProducts: Product[];
  totalOrdersCount?: number;
}

export default function DashboardClient({
  user,
  orders,
  designs: initialDesigns,
  bookings,
  recommendedProducts,
  totalOrdersCount
}: DashboardClientProps) {
  const { wishlistItems } = useWishlist();
  const [designs, setDesigns] = useState<Design[]>(initialDesigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | "active" | "delivered">("all");

  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm("Are you sure you want to delete this saved design?")) return;
    setDeletingId(designId);
    try {
      const res = await fetch(`/api/designs/${designId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDesigns(prev => prev.filter(d => d.id !== designId));
      } else {
        alert("Failed to delete design. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting design:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Real order stats
  const totalCount = totalOrdersCount !== undefined ? totalOrdersCount : orders.length;
  const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED");
  const activeCount = activeOrders.length;
  const deliveredCount = deliveredOrders.length;

  // Active / Spotlight Order
  const spotlightOrder = activeOrders[0] || orders[0] || null;

  // Order timeline calculations
  const getOrderStageIndex = (status: string) => {
    const s = status.toUpperCase();
    if (s === "DELIVERED") return 3;
    if (s === "DISPATCHED" || s === "SHIPPED") return 3;
    if (s === "QUALITY_CHECK" || s === "READY_TO_SHIP") return 2;
    if (s === "PROCESSING" || s === "IN_PRODUCTION") return 1;
    return 0; // PENDING, CONFIRMED
  };

  // Filtered orders list
  const filteredOrders = orderFilter === "all" 
    ? orders 
    : orderFilter === "active" 
      ? activeOrders 
      : deliveredOrders;

  const userInitial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.hubContainer}>
      
      {/* ── SECTION 1: CUSTOMER HEADER ── */}
      <header className={styles.customerHeader}>
        <div className={styles.profileRow}>
          <div className={styles.avatarWrapper} style={{ position: "relative" }}>
            <div className={styles.avatarInitial}>{userInitial}</div>
            {user?.image && !imgError && (
              <img 
                key={user.image}
                src={user.image} 
                alt={user.name || "Customer"} 
                width={56} 
                height={56} 
                className={styles.avatarImg}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
          <div className={styles.profileDetails}>
            <div className={styles.nameRow}>
              <h1 className={styles.customerName}>
                {greeting}, {user?.name?.split(" ")[0] || "Customer"}
              </h1>
              {user?.isB2BApproved && (
                <span className={styles.verifiedBadge}>Verified B2B</span>
              )}
            </div>
            <p className={styles.customerSubtitle}>Manage your orders, custom apparel & details</p>
            <div className={styles.metaRow}>
              {user?.email && <span className={styles.metaItem}>{user.email}</span>}
              {user?.phone && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.metaItem}>{user.phone}</span>
                </>
              )}
              {user?.companyName && (
                <>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.companyBadge}>
                    <Building2 size={12} /> {user.companyName}
                  </span>
                </>
              )}
            </div>
          </div>
          <Link href="/dashboard/profile" className={styles.editProfileBtn} aria-label="Edit Profile">
            Edit
          </Link>
        </div>
      </header>

      {/* ── SECTION 2: ORDER OVERVIEW ── */}
      <section className={styles.orderOverviewSection}>
        <div className={styles.overviewHeader}>
          <h2 className={styles.sectionHeading}>Your Orders</h2>
          {orders.length > 0 && (
            <Link href="/dashboard/orders" className={styles.viewAllLink}>
              View All ({totalCount}) <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Real Summary Metrics */}
        <div className={styles.orderStatsGrid}>
          <button 
            type="button"
            onClick={() => setOrderFilter("all")}
            className={`${styles.statPill} ${orderFilter === "all" ? styles.activeStatPill : ""}`}
          >
            <span className={styles.statCount}>{totalCount}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </button>
          <button 
            type="button"
            onClick={() => setOrderFilter("active")}
            className={`${styles.statPill} ${orderFilter === "active" ? styles.activeStatPill : ""}`}
          >
            <span className={styles.statCount}>{activeCount}</span>
            <span className={styles.statLabel}>In Progress</span>
          </button>
          <button 
            type="button"
            onClick={() => setOrderFilter("delivered")}
            className={`${styles.statPill} ${orderFilter === "delivered" ? styles.activeStatPill : ""}`}
          >
            <span className={styles.statCount}>{deliveredCount}</span>
            <span className={styles.statLabel}>Delivered</span>
          </button>
        </div>
      </section>

      {/* ── SECTION 3: ACTIVE / SPOTLIGHT ORDER ── */}
      <section className={styles.spotlightSection}>
        {spotlightOrder ? (
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightCardHeader}>
              <div className={styles.orderIdent}>
                <span className={styles.orderNumberLabel}>Order #TT{spotlightOrder.orderNumber}</span>
                <span className={styles.orderDateLabel}>
                  Placed on {new Date(spotlightOrder.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              <span className={`${styles.statusChip} ${styles[spotlightOrder.status.toLowerCase()] || styles.chipDefault}`}>
                {spotlightOrder.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Stepper Progress */}
            {spotlightOrder.status !== "CANCELLED" && (
              <div className={styles.stepperContainer}>
                <div className={styles.stepperBar}>
                  <div 
                    className={styles.stepperProgressLine} 
                    style={{ width: `${(getOrderStageIndex(spotlightOrder.status) / 3) * 100}%` }}
                  />
                </div>
                <div className={styles.stepperSteps}>
                  {[
                    { label: "Placed", index: 0 },
                    { label: "Production", index: 1 },
                    { label: "QC Passed", index: 2 },
                    { label: spotlightOrder.status === "DELIVERED" ? "Delivered" : "Dispatched", index: 3 }
                  ].map((step) => {
                    const currentIdx = getOrderStageIndex(spotlightOrder.status);
                    const isDone = currentIdx >= step.index;
                    const isCurrent = currentIdx === step.index;
                    return (
                      <div key={step.label} className={styles.stepNode}>
                        <div className={`${styles.stepDot} ${isDone ? styles.stepDotDone : ""} ${isCurrent ? styles.stepDotCurrent : ""}`}>
                          {isDone ? <CheckCircle2 size={12} /> : null}
                        </div>
                        <span className={`${styles.stepLabel} ${isDone ? styles.stepLabelDone : ""}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Item preview */}
            <div className={styles.spotlightItems}>
              {spotlightOrder.items.slice(0, 2).map((item) => {
                const img = item.mockupUrl || item.product.images?.[0] || "/placeholder_apparel.png";
                return (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemThumb}>
                      <Image 
                        src={img} 
                        alt={item.product.name} 
                        width={48} 
                        height={48} 
                        style={{ objectFit: "contain" }}
                        unoptimized
                      />
                    </div>
                    <div className={styles.itemText}>
                      <div className={styles.itemTitle}>{item.product.name}</div>
                      <div className={styles.itemSpecs}>
                        {item.quantity} pieces {item.design?.name ? `• ${item.design.name}` : ""}
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      ₹{item.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
              {spotlightOrder.items.length > 2 && (
                <div className={styles.moreItemsNote}>
                  + {spotlightOrder.items.length - 2} more item(s) in this order
                </div>
              )}
            </div>

            {/* Spotlight Actions */}
            <div className={styles.spotlightFooter}>
              <div className={styles.spotlightTotal}>
                Total: <span>₹{spotlightOrder.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className={styles.spotlightBtns}>
                <Link 
                  href="/dashboard/orders"
                  className={styles.trackOrderBtn}
                >
                  Track Order Details
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyOrderCard}>
            <div className={styles.emptyIconCircle}>
              <Package size={24} />
            </div>
            <h3 className={styles.emptyTitle}>No orders yet</h3>
            <p className={styles.emptyDesc}>Explore our wholesale catalogue and customize your team apparel.</p>
            <Link href="/products" className={styles.primaryActionBtn}>
              Explore Catalogue
            </Link>
          </div>
        )}
      </section>

      {/* ── SECTION 4: QUICK ACCESS (2-COLUMN GRID) ── */}
      <section className={styles.quickAccessSection}>
        <h2 className={styles.sectionHeading}>Quick Access</h2>
        <div className={styles.quickGrid}>
          
          <Link href="/dashboard/orders" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <Package size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>My Orders</span>
                {totalCount > 0 && <span className={styles.tileBadge}>{totalCount}</span>}
              </div>
              <p className={styles.tileDesc}>Track delivery & invoices</p>
            </div>
          </Link>

          <Link href="/dashboard/designs" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <Sparkles size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Saved Designs</span>
                {designs.length > 0 && <span className={styles.tileBadge}>{designs.length}</span>}
              </div>
              <p className={styles.tileDesc}>Continue 3D customizer</p>
            </div>
          </Link>

          <Link href="/wishlist" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <Heart size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Wishlist</span>
                {wishlistItems.length > 0 && <span className={styles.tileBadge}>{wishlistItems.length}</span>}
              </div>
              <p className={styles.tileDesc}>Bookmarked styles</p>
            </div>
          </Link>

          <Link href="/customizer" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <Shirt size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Customizer</span>
              </div>
              <p className={styles.tileDesc}>Design new apparel</p>
            </div>
          </Link>

          <Link href="/dashboard/bookings" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <CalendarCheck size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Showroom Visits</span>
                {bookings.length > 0 && <span className={styles.tileBadge}>{bookings.length}</span>}
              </div>
              <p className={styles.tileDesc}>Pune studio appointments</p>
            </div>
          </Link>

          <Link href="/dashboard/profile" className={styles.quickTile}>
            <div className={styles.tileIconBox}>
              <MapPin size={20} />
            </div>
            <div className={styles.tileContent}>
              <div className={styles.tileTitleRow}>
                <span className={styles.tileTitle}>Addresses</span>
              </div>
              <p className={styles.tileDesc}>Shipping destinations</p>
            </div>
          </Link>

        </div>
      </section>

      {/* ── SECTION 5: BUSINESS & ACCOUNT ── */}
      <section className={styles.businessSection}>
        <h2 className={styles.sectionHeading}>Account & Business Settings</h2>
        <div className={styles.menuGroupCard}>
          
          <Link href="/dashboard/profile" className={styles.menuRow}>
            <div className={styles.menuLeft}>
              <div className={styles.menuIcon}>
                <User size={18} />
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Personal Information</div>
                <div className={styles.menuSub}>{user.name || "Manage name, email & phone"}</div>
              </div>
            </div>
            <ChevronRight size={18} className={styles.menuChevron} />
          </Link>

          <div className={styles.menuDivider} />

          <Link href="/dashboard/profile" className={styles.menuRow}>
            <div className={styles.menuLeft}>
              <div className={styles.menuIcon}>
                <Building2 size={18} />
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Business & GST Details</div>
                <div className={styles.menuSub}>
                  {user.companyName 
                    ? `${user.companyName} • GST: ${user.gstNumber || "Not set"}`
                    : "Add company name & GST for B2B tax invoices"}
                </div>
              </div>
            </div>
            <ChevronRight size={18} className={styles.menuChevron} />
          </Link>

          <div className={styles.menuDivider} />

          <Link href="/dashboard/profile" className={styles.menuRow}>
            <div className={styles.menuLeft}>
              <div className={styles.menuIcon}>
                <MapPin size={18} />
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Saved Addresses</div>
                <div className={styles.menuSub}>
                  {user.Address && user.Address.length > 0 
                    ? `${user.Address.length} address(es) configured`
                    : "Add shipping & billing destinations"}
                </div>
              </div>
            </div>
            <ChevronRight size={18} className={styles.menuChevron} />
          </Link>

          <div className={styles.menuDivider} />

          <Link href="/dashboard/transactions" className={styles.menuRow}>
            <div className={styles.menuLeft}>
              <div className={styles.menuIcon}>
                <FileText size={18} />
              </div>
              <div className={styles.menuText}>
                <div className={styles.menuTitle}>Invoices & Payments</div>
                <div className={styles.menuSub}>View past transaction receipts</div>
              </div>
            </div>
            <ChevronRight size={18} className={styles.menuChevron} />
          </Link>

        </div>
      </section>

      {/* ── SECTION 6: SAVED CONTENT ── */}
      <section className={styles.savedContentSection}>
        <div className={styles.savedSectionHeader}>
          <h2 className={styles.sectionHeading}>Saved Custom Designs</h2>
          {designs.length > 0 && (
            <Link href="/dashboard/designs" className={styles.viewAllLink}>
              View All ({designs.length}) <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {designs.length === 0 ? (
          <div className={styles.emptySavedBox}>
            <p className={styles.emptySavedText}>No saved custom designs yet.</p>
            <Link href="/customizer" className={styles.emptyActionSmall}>
              + Start 3D Design
            </Link>
          </div>
        ) : (
          <div className={styles.designsShelf}>
            {designs.slice(0, 3).map((design) => {
              const img = design.imageUrl || design.product?.images?.[0] || "/placeholder_apparel.png";
              return (
                <div key={design.id} className={styles.designMiniCard}>
                  <div className={styles.designThumb}>
                    <Image 
                      src={img} 
                      alt={design.name} 
                      fill 
                      style={{ objectFit: "contain" }}
                      sizes="120px"
                      unoptimized
                    />
                  </div>
                  <div className={styles.designInfo}>
                    <div className={styles.designTitle}>{design.name}</div>
                    <div className={styles.designDate}>
                      {new Date(design.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                    </div>
                    <div className={styles.designActionsRow}>
                      <Link 
                        href={`/customizer?designId=${design.id}`}
                        className={styles.designEditAction}
                      >
                        Edit in 3D
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteDesign(design.id)}
                        disabled={deletingId === design.id}
                        className={styles.designDeleteAction}
                        title="Delete design"
                        aria-label="Delete design"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SECTION 7: SUPPORT ── */}
      <section className={styles.supportSection}>
        <h2 className={styles.sectionHeading}>Customer Support & Showroom</h2>
        <div className={styles.supportCardsGrid}>
          
          {/* WhatsApp Direct Chat */}
          <a 
            href="https://wa.me/919022553346?text=Hi%20Tailoring%20Turba%2C%20I%20have%20an%20enquiry%20regarding%20my%20orders%2Fbulk%20manufacturing" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.supportTileWhatsapp}
          >
            <div className={styles.supportIconWhatsapp}>
              <MessageCircle size={22} />
            </div>
            <div className={styles.supportContent}>
              <div className={styles.supportTitle}>Chat with us on WhatsApp</div>
              <div className={styles.supportSub}>Quick assistance with sizing, pricing & bulk orders &rarr;</div>
            </div>
          </a>

          {/* Pune Showroom Card */}
          <div className={styles.showroomTile}>
            <div className={styles.showroomHeader}>
              <div className={styles.showroomTitle}>
                <MapPin size={16} /> Pune Showroom & Experience Centre
              </div>
              <span className={styles.timingBadge}>
                <Clock size={12} /> 11:00 AM – 8:00 PM
              </span>
            </div>
            <p className={styles.showroomAddress}>
              321/1, Jawaharlal Nehru Road, Mahatma Phule Peth, near HDFC Bank, Pune 411042
            </p>
            <div className={styles.showroomActions}>
              <Link href="/booking" className={styles.showroomBtn}>
                Book Consultation Visit
              </Link>
              <a 
                href="tel:+919022553346" 
                className={styles.callBtn}
                aria-label="Call Tailoring Turba"
              >
                <Phone size={14} /> +91 90225 53346
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 8: LOG OUT ── */}
      <div className={styles.logoutWrapper}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={styles.logoutButton}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}
