import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id as string;

  const [orders, designs, bookings] = await Promise.all([
    prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, include: { items: true } }),
    prisma.design.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.booking.findMany({ where: { userId, status: { in: ["REQUESTED", "CONFIRMED"] } }, orderBy: { date: "asc" } }),
  ]);

  const totalSpent = orders.reduce((s, o) => s + o.totalAmount, 0);

  const stats = [
    { label: "Total Orders", value: orders.length, icon: "📦", color: "#FF6B35" },
    { label: "Designs Made", value: designs.length, icon: "🎨", color: "#667EEA" },
    { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: "💰", color: "#48BB78" },
    { label: "Appointments", value: bookings.length, icon: "📅", color: "#ECC94B" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good {getGreeting()}, {session?.user?.name?.split(" ")[0]} 👋</h1>
          <p className={styles.sub}>Here&apos;s what&apos;s happening with your account.</p>
        </div>
        <Link href="/customizer" className="btn-primary">+ New Design</Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className={`${styles.statCard} glass-card`}>
            <div className={styles.statIcon} style={{ background: `${s.color}18`, border: `1px solid ${s.color}25` }}>
              {s.icon}
            </div>
            <div>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* Recent Orders */}
        <div className={`${styles.block} glass-card`}>
          <div className={styles.blockHeader}>
            <h2>Recent Orders</h2>
            <Link href="/dashboard/orders" className={styles.seeAll}>See all →</Link>
          </div>
          {orders.length === 0 ? (
            <div className={styles.empty}>No orders yet. <Link href="/customizer">Start designing!</Link></div>
          ) : (
            <div className={styles.orderList}>
              {orders.map(o => (
                <div key={o.id} className={styles.orderRow}>
                  <div>
                    <div className={styles.orderId}>#{o.id.slice(-8).toUpperCase()}</div>
                    <div className={styles.orderMeta}>{o.items.length} item(s)</div>
                  </div>
                  <div>
                    <div className={styles.orderAmount}>₹{o.totalAmount.toLocaleString()}</div>
                    <div className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className={`${styles.block} glass-card`}>
          <div className={styles.blockHeader}>
            <h2>Pune Appointments</h2>
            <Link href="/booking" className={styles.seeAll}>Book New →</Link>
          </div>
          {bookings.length === 0 ? (
            <div className={styles.empty}>
              No upcoming visits. <Link href="/booking">Book a showroom appointment!</Link>
            </div>
          ) : (
            <div className={styles.bookingList}>
              {bookings.map(b => (
                <div key={b.id} className={styles.bookingRow}>
                  <div className={styles.bookingDate}>
                    📅 {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className={styles.bookingSlot}>🕐 {b.timeSlot}</div>
                  <div className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        {[
          { icon: "🎨", label: "New Design", href: "/customizer", color: "#FF6B35" },
          { icon: "📋", label: "Order Roster", href: "/dashboard/designs", color: "#667EEA" },
          { icon: "📅", label: "Book Showroom", href: "/booking", color: "#ECC94B" },
          { icon: "👤", label: "Edit Profile", href: "/dashboard/profile", color: "#48BB78" },
        ].map((a, i) => (
          <Link key={i} href={a.href} className={`${styles.quickAction} glass-card`}>
            <div className={styles.qaIcon} style={{ color: a.color }}>{a.icon}</div>
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
