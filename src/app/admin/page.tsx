export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  Shirt,
  ChevronRight
} from "lucide-react";
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
    { label: "Revenue", value: `₹${(revenue._sum.totalAmount ?? 0).toLocaleString()}`, icon: TrendingUp, color: "var(--tth-black)", change: "+12.5%" },
    { label: "Customers", value: userCount, icon: Users, color: "var(--tth-black)", change: "+8%" },
    { label: "Orders", value: orderCount, icon: ShoppingBag, color: "var(--tth-black)", change: "+23%" },
    { label: "Pending", value: pendingOrders, icon: Clock, color: "var(--tth-olive-dark)", change: "" },
    { label: "Bookings", value: bookingCount, icon: Calendar, color: "var(--tth-black)", change: "" },
    { label: "Inventory", value: products.length, icon: Shirt, color: "var(--tth-black)", change: "" },
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
          <div key={i} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            {s.change && <div className={styles.change}>{s.change}</div>}
            <div className={styles.statIcon}><s.icon size={24} /></div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className={styles.tableBlock}>
        <div className={styles.tableHeader}>
          <h2>Recent Activity</h2>
          <a href="/admin/orders" className={styles.link}>All Orders <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></a>
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

