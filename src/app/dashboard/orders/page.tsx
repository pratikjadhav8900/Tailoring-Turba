import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";

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
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.sub}>{orders.length} total orders</p>
        </div>
        <Link href="/customizer" className="btn-primary">+ New Order</Link>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No orders yet</h3>
          <p>Start by customizing a product and placing your first order.</p>
          <Link href="/customizer" className="btn-primary" style={{ marginTop: 16 }}>Start Designing</Link>
        </div>
      ) : (
        <div className={styles.orderList}>
          {orders.map(order => (
            <div key={order.id} className={`${styles.orderCard} glass-card`}>
              <div className={styles.orderTop}>
                <div>
                  <div className={styles.orderId}>Order #{order.id.slice(-10).toUpperCase()}</div>
                  <div className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className={styles.orderRight}>
                  <div className={styles.amount}>₹{order.totalAmount.toLocaleString()}</div>
                  <div className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className={styles.items}>
                {order.items.map(item => (
                  <div key={item.id} className={styles.item}>
                    <span className={styles.itemName}>{item.product.name}</span>
                    <span className={styles.itemQty}>× {item.quantity}</span>
                    <span className={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Roster if available */}
              {order.orderSheet && (
                <div className={styles.rosterBadge}>
                  📋 Roster / Order Sheet attached
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
