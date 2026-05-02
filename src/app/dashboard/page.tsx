export const dynamic = 'force-dynamic';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";
import { 
  Package, 
  Paintbrush, 
  CreditCard, 
  CalendarCheck, 
  Plus,
  ArrowRight,
  ClipboardList,
  User
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

import Image from "next/image";

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
    { label: "Total Orders", value: orders.length, icon: <Package size={24} />, color: "var(--tth-olive)" },
    { label: "Designs Made", value: designs.length, icon: <Paintbrush size={24} />, color: "var(--tth-olive)" },
    { label: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: <CreditCard size={24} />, color: "var(--tth-olive)" },
    { label: "Appointments", value: bookings.length, icon: <CalendarCheck size={24} />, color: "var(--tth-olive)" },
  ];

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
            <h1 className={styles.title}>Good {getGreeting()}, {session?.user?.name?.split(" ")[0]}</h1>
            <p className={styles.sub}>Here is your Tailoring Turba ledger and activity overview.</p>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statIcon} style={{ color: s.color }}>
                {s.icon}
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && bookings.length === 0 && designs.length === 0 ? (
          <div style={{ marginTop: '40px' }}>
            <EmptyState 
              illustration="/illustrations/empty_dashboard.png"
              title="Welcome to your Studio"
              description="Your activity ledger is currently clean. Start by exploring our products or booking a showroom visit."
              ctaText="Start Designing"
              ctaHref="/products"
            />
          </div>
        ) : (
          <div className={styles.grid2}>
            {/* Recent Orders */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <h2>Recent Orders</h2>
                <Link href="/dashboard/orders" className={styles.seeAll}>
                  View Ledger <ArrowRight size={16} />
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className={styles.empty}>
                  <Package size={32} strokeWidth={1} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <div>No orders yet.</div>
                </div>
              ) : (
                <div className={styles.orderList}>
                  {orders.map(o => (
                    <div key={o.id} className={styles.orderRow}>
                      <div className={styles.orderInfo}>
                        <div className={styles.orderId}>#{o.id.slice(-8).toUpperCase()}</div>
                        <div className={styles.orderMeta}>{o.items.length} item(s)</div>
                      </div>
                      <div className={styles.orderValue}>
                        <div className={styles.orderAmount}>₹{o.totalAmount.toLocaleString()}</div>
                        <div className={`${styles.badge} ${styles[`badge-${o.status.toLowerCase()}`]}`}>
                          {o.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Bookings */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <h2>Pune Appointments</h2>
                <Link href="/booking" className={styles.seeAll}>
                  Book Showroom <ArrowRight size={16} />
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className={styles.empty}>
                  <CalendarCheck size={32} strokeWidth={1} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <div>No upcoming visits.</div>
                </div>
              ) : (
                <div className={styles.bookingList}>
                  {bookings.map(b => (
                    <div key={b.id} className={styles.bookingRow}>
                      <div className={styles.bookingDate}>
                        {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div className={styles.bookingSlot}>{b.timeSlot}</div>
                      <div className={`${styles.badge} ${styles[`badge-${b.status.toLowerCase()}`]}`}>
                        {b.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

