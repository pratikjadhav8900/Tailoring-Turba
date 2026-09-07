export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { Package, Plus, FileText, Truck, AlertCircle, CheckCircle2, ExternalLink, CreditCard } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import OrderTracking from "@/components/shared/OrderTracking";
import CancelOrderButton from "@/components/shared/CancelOrderButton";
import Image from "next/image";
import { getEstimatedDeliveryDateRange } from "@/lib/delivery";
import { calculateLedgerFromTransactions, rupeesToPaise, paiseToRupees, formatPaiseToINR } from "@/lib/currency";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  if (!userId) {
    return (
      <div className={styles.page} style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-ui)", fontSize: "1.85rem", fontWeight: 700 }}>Unauthorized</h2>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--tth-text-muted)" }}>Please log in to view your orders.</p>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: { include: { product: true } },
      orderSheet: true,
      paymentTransactions: true,
      shipments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
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
          {orders.map(order => {
            // Compute authoritative ledger metrics
            let ledger;
            if (order.paymentTransactions && order.paymentTransactions.length > 0) {
              ledger = calculateLedgerFromTransactions(rupeesToPaise(order.totalAmount), order.paymentTransactions as any);
            } else {
              const grossPaidPaise = rupeesToPaise(order.amountPaid || 0);
              const totalPaise = rupeesToPaise(order.totalAmount);
              const balancePaise = Math.max(0, totalPaise - grossPaidPaise);
              ledger = {
                orderTotalPaise: totalPaise,
                grossPaidPaise,
                totalRefundedPaise: rupeesToPaise(order.refundedAmount || 0),
                netPaidPaise: grossPaidPaise,
                balanceDuePaise: balancePaise,
                isPaidInFull: balancePaise === 0,
              };
            }

            const activeShipment = order.shipments?.[0] || null;
            const awb = activeShipment?.awbNumber || order.bigshipTrackingId;
            const carrier = activeShipment?.courierName || order.bigshipCourierName || "Logistics Partner";
            const balanceDueRupees = Math.round(paiseToRupees(ledger.balanceDuePaise));
            const netPaidRupees = Math.round(paiseToRupees(ledger.netPaidPaise));

            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderTop}>
                  <div>
                    <div className={styles.orderId}>Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</div>
                    <div className={styles.orderDate}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#4b5563' }}>🚚 Est. Delivery:</span> 
                        <span style={{ fontWeight: 600 }}>{getEstimatedDeliveryDateRange(order.createdAt, order.items.reduce((sum, item) => sum + item.quantity, 0))}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.orderRight}>
                    <div className={styles.amount}>₹{order.totalAmount.toLocaleString('en-IN')}</div>
                    <div className={`${styles.badge} ${styles[`badge-${order.status.toLowerCase()}`] || styles['badge-pending']}`}>
                      {order.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Live Courier Tracking Info */}
                {awb && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    margin: '0 0 20px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '8px', color: '#166534' }}>
                        <Truck size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Live Shipment Details {activeShipment?.status ? `• ${activeShipment.status.replace(/_/g, ' ')}` : ''}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#14532d', marginTop: '2px' }}>
                          Courier: <strong>{carrier}</strong> &nbsp;|&nbsp; Tracking AWB: <strong style={{ letterSpacing: '0.5px' }}>{awb}</strong>
                        </div>
                      </div>
                    </div>
                    <a 
                      href={awb.startsWith("http") ? awb : `https://app.bigship.in/track_order`} 
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#16a34a',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Track Shipment <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* Visual Order Progress (7-Stage Synchronized Pipeline) */}
                <OrderTracking 
                  status={order.status} 
                  shipmentStatus={activeShipment?.status} 
                />

                {/* Amber Pending Balance Alert Card */}
                {ledger.balanceDuePaise > 0 && order.status !== "CANCELLED" && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    margin: '20px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', color: '#b45309' }}>
                        <CreditCard size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e' }}>
                          Balance Settlement Required: ₹{balanceDueRupees.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#78350f', marginTop: '2px' }}>
                          Deposit of ₹{netPaidRupees.toLocaleString('en-IN')} received. To initiate dispatch and release delivery, please clear the balance.
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/checkout/pay-balance?orderId=${order.id}`}
                      style={{
                        background: '#b45309',
                        color: 'white',
                        padding: '10px 22px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)',
                        transition: 'background 0.2s'
                      }}
                    >
                      Pay Remaining Balance (₹{balanceDueRupees.toLocaleString('en-IN')})
                    </Link>
                  </div>
                )}

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
                  {/* Left Side: Payment Status */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "var(--tth-text-muted)" }}>
                      {ledger.isPaidInFull ? (
                        <span style={{ color: "#16a34a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={16} /> Payment: Paid in Full (₹{order.totalAmount.toLocaleString('en-IN')})
                        </span>
                      ) : (
                        <>
                          Paid: <strong>₹{netPaidRupees.toLocaleString('en-IN')}</strong> of ₹{order.totalAmount.toLocaleString('en-IN')} 
                          <span style={{ color: "#d97706", marginLeft: "6px", fontWeight: 600 }}>
                            • Balance Due: ₹{balanceDueRupees.toLocaleString('en-IN')}
                          </span>
                        </>
                      )}
                    </div>
                    {ledger.totalRefundedPaise > 0 && (
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "#dc2626", fontWeight: 600 }}>
                        Refunded: ₹{Math.round(paiseToRupees(ledger.totalRefundedPaise)).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Pay Balance Button */}
                    {ledger.balanceDuePaise > 0 && order.status !== "CANCELLED" && (
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
                        Pay Balance (₹{balanceDueRupees.toLocaleString('en-IN')})
                      </Link>
                    )}

                    {/* Cancel Button (Available for PENDING, CONFIRMED, or PROCESSING within 24 hours) */}
                    {(order.status === "PENDING" || order.status === "CONFIRMED" || order.status === "PROCESSING") && (() => {
                      const now = new Date();
                      const created = new Date(order.createdAt);
                      const diffInMs = now.getTime() - created.getTime();
                      const isWithin24h = diffInMs <= 24 * 60 * 60 * 1000;
                      
                      return (
                        <CancelOrderButton 
                          orderId={order.id} 
                          orderNumber={order.orderNumber ? String(order.orderNumber) : ""} 
                          isPaid={netPaidRupees > 0} 
                          isWithin24h={isWithin24h} 
                        />
                      );
                    })()}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
