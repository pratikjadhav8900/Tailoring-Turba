import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { Package, Plus, FileText } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import OrderTracking from "@/components/OrderTracking";

import Image from "next/image";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

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
                  <div className={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</div>
                  <div className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className={styles.orderRight}>
                  <div className={styles.amount}>₹{order.totalAmount.toLocaleString()}</div>
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
                    <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Roster if available */}
              {order.orderSheet && (
                <div className={styles.rosterBadge}>
                  <FileText size={16} /> Roster attached
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
