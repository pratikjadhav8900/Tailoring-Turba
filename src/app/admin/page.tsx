import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export default async function AdminDashboard() {
  const [userCount, orderCount, bookingCount, products] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.booking.count(),
    prisma.product.findMany({ take: 5, include: { category: true } }),
  ]);

  const revenue = await prisma.order.aggregate({ _sum: { totalAmount: true } });
  const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, items: true },
  });

  const stats = [
    { label: "Total Revenue", value: `₹${(revenue._sum.totalAmount ?? 0).toLocaleString()}`, icon: "💰", color: "#48BB78", change: "+12%" },
    { label: "Total Users", value: userCount, icon: "👥", color: "#667EEA", change: "+8%" },
    { label: "Total Orders", value: orderCount, icon: "📦", color: "#FF6B35", change: "+23%" },
    { label: "Pending Orders", value: pendingOrders, icon: "⏳", color: "#ECC94B", change: "" },
    { label: "Bookings", value: bookingCount, icon: "📅", color: "#FC8181", change: "" },
    { label: "Products", value: products.length, icon: "👕", color: "#F6AD55", change: "" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.sub}>Tailoring Turba platform overview</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} className={`${styles.statCard} glass-card`}>
            <div className={styles.statTop}>
              <div className={styles.statLabel}>{s.label}</div>
              {s.change && <div className={styles.change}>{s.change}</div>}
            </div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.statIcon}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className={`${styles.tableBlock} glass-card`}>
        <div className={styles.tableHeader}>
          <h2>Recent Orders</h2>
          <a href="/admin/orders" className={styles.link}>View all →</a>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td><span className={styles.mono}>#{o.id.slice(-8).toUpperCase()}</span></td>
                  <td>
                    <div className={styles.customerName}>{o.user.name}</div>
                    <div className={styles.customerEmail}>{o.user.email}</div>
                  </td>
                  <td>{o.items.length}</td>
                  <td className={styles.amount}>₹{o.totalAmount.toLocaleString()}</td>
                  <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td className={styles.date}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
