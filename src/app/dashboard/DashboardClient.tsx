"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Package, 
  Paintbrush, 
  Heart, 
  Calendar, 
  User, 
  ArrowRight, 
  Trash2, 
  MapPin, 
  Mail, 
  Phone,
  Clock,
  Sparkles
} from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import ProductCard from "@/components/ui/ProductCard";
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
  createdAt: Date;
  orderNumber: number;
  items: OrderItem[];
}

interface Design {
  id: string;
  name: string;
  createdAt: Date;
  imageUrl: string | null;
  product: {
    name: string;
    images: string[];
    type: string | null;
  } | null;
}

interface Booking {
  id: string;
  date: Date;
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
  colors: number | null;
  features: string[];
  type: string | null;
  brand: string | null;
}

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  orders: Order[];
  designs: Design[];
  bookings: Booking[];
  recommendedProducts: Product[];
}

export default function DashboardClient({
  user,
  orders,
  designs: initialDesigns,
  bookings,
  recommendedProducts
}: DashboardClientProps) {
  const { wishlistItems } = useWishlist();
  const [designs, setDesigns] = useState<Design[]>(initialDesigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return;
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

  return (
    <div className={styles.container}>
      
      {/* 1. Header Section */}
      <header className={styles.header}>
        <div className={styles.headerWelcome}>
          <h1 className={styles.welcomeTitle}>
            {getGreeting()}, {user?.name?.split(" ")[0] || "Guest"}
          </h1>
          <p className={styles.welcomeSub}>
            Manage your orders, custom designs, and showroom bookings in one space.
          </p>
        </div>
        <Link href="/customizer" className={styles.startDesigningCta}>
          <Sparkles size={16} />
          <span>Start Designing</span>
        </Link>
      </header>

      {/* 2. Quick Actions */}
      <section className={styles.quickActions}>
        <Link href="#orders" className={styles.actionCard}>
          <Package className={styles.actionIcon} size={22} strokeWidth={1.5} />
          <div className={styles.actionInfo}>
            <h4>My Orders</h4>
            <p>Track delivery & history</p>
          </div>
        </Link>
        <Link href="#designs" className={styles.actionCard}>
          <Paintbrush className={styles.actionIcon} size={22} strokeWidth={1.5} />
          <div className={styles.actionInfo}>
            <h4>Saved Designs</h4>
            <p>Continue customization</p>
          </div>
        </Link>
        <Link href="#wishlist" className={styles.actionCard}>
          <Heart className={styles.actionIcon} size={22} strokeWidth={1.5} />
          <div className={styles.actionInfo}>
            <h4>Wishlist</h4>
            <p>View bookmarked styles</p>
          </div>
        </Link>
        <Link href="/dashboard/profile" className={styles.actionCard}>
          <User className={styles.actionIcon} size={22} strokeWidth={1.5} />
          <div className={styles.actionInfo}>
            <h4>Profile</h4>
            <p>Manage account settings</p>
          </div>
        </Link>
      </section>

      {/* 3. Recent Orders */}
      <section id="orders" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Orders</h3>
          {orders.length > 0 && (
            <Link href="/dashboard/orders" className={styles.sectionLink}>
              View All Orders <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>You haven't placed an order yet.</p>
            <div className={styles.emptyCtas}>
              <Link href="/customizer" className={styles.emptyBtnPrimary}>
                Start Designing
              </Link>
              <Link href="/products" className={styles.emptyBtnSecondary}>
                Explore Products
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} className={styles.orderItem}>
                <div className={styles.orderMetaRow}>
                  <div>
                    <span className={styles.orderNumber}>Order #TT{order.orderNumber}</span>
                    <span className={styles.orderDate}>
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()] || ""}`}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.orderProducts}>
                  {order.items.map((item) => {
                    const fallbackImg = item.product.images?.[0] || "";
                    const thumbnail = item.mockupUrl || fallbackImg;
                    return (
                      <div key={item.id} className={styles.orderProductRow}>
                        <div className={styles.orderProductThumb}>
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={item.product.name}
                              fill
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <div className={styles.noThumb}>No Img</div>
                          )}
                        </div>
                        <div className={styles.orderProductInfo}>
                          <h5>{item.product.name}</h5>
                          <p className={styles.orderProductSpecs}>
                            {item.quantity} pieces {item.design?.name ? `· Design: ${item.design.name}` : ""}
                          </p>
                        </div>
                        <div className={styles.orderProductPrice}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    Total Amount: <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className={styles.orderActions}>
                    <Link href={`/dashboard/orders/${order.id}`} className={styles.viewOrderBtn}>
                      View Order Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Continue Designing */}
      <section id="designs" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Continue Designing</h3>
          {designs.length > 0 && (
            <Link href="/dashboard/designs" className={styles.sectionLink}>
              View All Designs <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {designs.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>No saved custom designs found.</p>
            <Link href="/customizer" className={styles.emptyBtnPrimary}>
              + Start New Design
            </Link>
          </div>
        ) : (
          <div className={styles.designsGrid}>
            {designs.map((design) => {
              const fallbackImage = design.product?.images?.[0] || "/placeholder_apparel.png";
              const imageUrl = design.imageUrl || fallbackImage;

              return (
                <div key={design.id} className={styles.designCard}>
                  <div className={styles.designImageWrapper}>
                    <Image
                      src={imageUrl}
                      alt={design.name}
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className={styles.designContent}>
                    <h4 className={styles.designName}>{design.name}</h4>
                    <p className={styles.designMeta}>
                      {design.product?.name || "Custom Apparel"} · {new Date(design.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                    </p>
                    <div className={styles.designActions}>
                      <Link 
                        href={`/customizer?designId=${design.id}`} 
                        className={styles.designEditBtn}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        disabled={deletingId === design.id}
                        className={styles.designDeleteBtn}
                        title="Delete saved design"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Wishlist */}
      <section id="wishlist" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>My Wishlist</h3>
          {wishlistItems.length > 0 && (
            <Link href="/wishlist" className={styles.sectionLink}>
              Manage Wishlist <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyText}>Your wishlist is empty.</p>
            <Link href="/products" className={styles.emptyBtnSecondary}>
              Explore Products
            </Link>
          </div>
        ) : (
          <div className={styles.productsGrid}>
            {wishlistItems.slice(0, 4).map((item) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  name: item.name,
                  description: item.description || "",
                  basePrice: Number(item.price) || 0,
                  minOrderQuantity: item.minOrderQuantity || 10,
                  images: item.gallery || [item.image],
                  badge: item.badge,
                  colors: item.colors,
                  features: item.features || [],
                  type: item.type,
                  brand: item.brand
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Upcoming Appointments */}
      {bookings.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Pune Showroom Appointments</h3>
            <Link href="/booking" className={styles.sectionLink}>
              Book Another Visit <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.bookingsGrid}>
            {bookings.map((booking) => (
              <div key={booking.id} className={styles.bookingCard}>
                <Calendar className={styles.bookingIcon} size={20} />
                <div className={styles.bookingInfo}>
                  <h5>
                    {new Date(booking.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </h5>
                  <p>{booking.timeSlot}</p>
                </div>
                <span className={`${styles.bookingStatus} ${styles[booking.status.toLowerCase()] || ""}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Explore More Apparel (Recommendations) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Explore More Apparel</h3>
          <Link href="/products" className={styles.sectionLink}>
            Browse All <ArrowRight size={14} />
          </Link>
        </div>
        <div className={styles.productsGrid}>
          {recommendedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 8. Account Summary & Support Info */}
      <section className={styles.accountSupport}>
        <div className={styles.supportCard}>
          <h3>Pune Showroom</h3>
          <p className={styles.address}>
            <MapPin size={16} />
            <span>321/1, Jawaharlal Nehru Road, Mahatma Phule Peth, near HDFC Bank, Pune, Maharashtra 411042, India</span>
          </p>
          <p className={styles.timings}>
            <Clock size={16} />
            <span>Open daily: 11:00 AM – 8:00 PM</span>
          </p>
          <div className={styles.supportLinks}>
            <Link href="/booking" className={styles.supportCta}>
              Book Showroom Consultation
            </Link>
          </div>
        </div>

        <div className={styles.supportCard}>
          <h3>Contact Support</h3>
          <p className={styles.supportDesc}>
            Need assistance with bulk customization, sizing charts, or custom fabric sourcing?
          </p>
          <div className={styles.contactDetails}>
            <a href="mailto:tailoringturba@gmail.com" className={styles.contactItem}>
              <Mail size={16} />
              <span>tailoringturba@gmail.com</span>
            </a>
            <a href="tel:+919022553346" className={styles.contactItem}>
              <Phone size={16} />
              <span>+91 90225 53346</span>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
