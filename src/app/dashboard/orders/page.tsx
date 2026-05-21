export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { Package, Plus, FileText } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import OrderTracking from "@/components/OrderTracking";
import CancelOrderButton from "@/components/CancelOrderButton";
import Image from "next/image";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  if (!userId) {
    return (
      <div className={styles.page} style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>Unauthorized</h2>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--tth-text-muted)" }}>Please log in to view your orders.</p>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } }, orderSheet: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.page}>
      
      {/* Premium Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroBg}>
          <Image 
            src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=2000"
            alt="Tailoring Background"
            fill
            priority
          />
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div>
            <h1 className={styles.title}>My Orders</h1>
            <p className={styles.sub}>{orders.length} total orders</p>
          </div>
          <Link href="/customizer" className={styles.primaryBtn}>
            <Plus size={18} /> New Order
          </Link>
        </div>
      </div>

      <div className={styles.mainContent}>
        {orders.length === 0 ? (
          <EmptyState 
            illustration="/illustrations/empty_orders.png"
            title="No orders yet"
            description="Your order ledger is empty. Start by customizing a product and placing your first order."
            ctaText="Start Designing"
            ctaHref="/products"
          />
        ) : (
        <div className={styles.orderList}>
          {orders.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderTop}>
                <div>
                  <div className={styles.orderId}>Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</div>
                  <div className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className={styles.orderRight}>
                  <div className={styles.amount}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                  <div className={`${styles.badge} ${styles[`badge-${order.status.toLowerCase()}`]}`}>{order.status}</div>
                </div>
              </div>

              {/* Visual Order Progress */}
              <OrderTracking status={order.status} />

              {/* Order Items */}
              <div className={styles.items}>
                {order.items.map(item => (
                  <div key={item.id} className={styles.item}>
                    <Link href={`/products/${item.product.id}`} className={styles.itemImage}>
                      <Image 
                        src={item.product.images?.[0] || "/placeholder.png"} 
                        alt={item.product.name} 
                        width={48} 
                        height={48} 
                        className={styles.thumbnail}
                      />
                    </Link>
                    <Link href={`/products/${item.product.id}`} className={styles.itemName}>
                      {item.product.name}
                    </Link>
                    <span className={styles.itemQty}>× {item.quantity}</span>
                    <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              {/* Roster if available */}
              {order.orderSheet && (
                <div className={styles.rosterBadge} style={{ marginBottom: "16px" }}>
                  <FileText size={16} /> Roster attached
                </div>
              )}

              {/* Payment Details & Actions */}
              <div style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid var(--tth-beige-light)",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px"
              }}>
                {/* Left Side: Payment Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--tth-text-muted)" }}>
                    {order.isSplitPayment ? (
                      <>
                        Split Payment: <strong>Paid ₹{order.amountPaid.toLocaleString('en-IN')}</strong> of ₹{order.totalAmount.toLocaleString('en-IN')} 
                        {order.secondPaymentStatus === "PAID" ? (
                          <span style={{ color: "#16a34a", marginLeft: "6px", fontWeight: 600 }}>• Balance Fully Paid</span>
                        ) : (
                          <span style={{ color: "#d97706", marginLeft: "6px", fontWeight: 600 }}>• Balance Due: ₹{order.remainingAmount.toLocaleString('en-IN')}</span>
                        )}
                      </>
                    ) : (
                      <>
                        Total Amount Paid: <strong>₹{order.amountPaid.toLocaleString('en-IN')}</strong>
                      </>
                    )}
                  </div>
                  {order.refundedAmount && order.refundedAmount > 0 && (
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "#dc2626", fontWeight: 600 }}>
                      Refunded: ₹{order.refundedAmount.toLocaleString('en-IN')} (Refund ID: {order.refundId})
                    </div>
                  )}
                </div>

                {/* Right Side: Action Buttons */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {/* Pay Balance Button */}
                  {order.isSplitPayment && order.remainingAmount > 0 && order.secondPaymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                    <Link
                      href={`/checkout/pay-balance?orderId=${order.id}`}
                      style={{
                        background: "var(--tth-olive-dark)",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        transition: "opacity 0.2s"
                      }}
                    >
                      Pay Balance (₹{order.remainingAmount.toLocaleString('en-IN')})
                    </Link>
                  )}

                  {/* Cancel Button (Available for PENDING or PROCESSING, and only within 24 hours of placement) */}
                  {(order.status === "PENDING" || order.status === "PROCESSING") && (() => {
                    const now = new Date();
                    const created = new Date(order.createdAt);
                    const diffInMs = now.getTime() - created.getTime();
                    const isWithin24h = diffInMs <= 24 * 60 * 60 * 1000;
                    
                    return (
                      <CancelOrderButton 
                        orderId={order.id} 
                        orderNumber={order.orderNumber || ""} 
                        isPaid={order.amountPaid > 0} 
                        isWithin24h={isWithin24h} 
                      />
                    );
                  })()}
                </div>
              </div>

            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
