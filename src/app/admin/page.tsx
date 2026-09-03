export const dynamic = 'force-dynamic';

import { prisma, withRetry } from "@/lib/prisma";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import AdminKpiGrid from "@/components/admin/dashboard/AdminKpiGrid";
import ProductionPipeline from "@/components/admin/dashboard/ProductionPipeline";
import NeedsAttentionPanel from "@/components/admin/dashboard/NeedsAttentionPanel";
import InventorySnapshot from "@/components/admin/dashboard/InventorySnapshot";
import RecentOperationsFeed from "@/components/admin/dashboard/RecentOperationsFeed";
import styles from "./page.module.css";

export default async function AdminDashboard() {
  const [
    userCount,
    orderCount,
    bookingCount,
    products,
    totalProductsCount,
    revenue,
    pendingOrdersCount,
    processingOrdersCount,
    shippedOrdersCount,
    deliveredOrdersCount,
    newInquiriesCount,
    sampledQuotedInquiriesCount,
    pendingOrdersList,
    newInquiriesList,
    requestedBookingsList,
    recentOrders,
    categoriesWithCounts,
  ] = await withRetry(() =>
    Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.booking.count(),
      prisma.product.findMany({
        take: 6,
        orderBy: { updatedAt: "desc" },
        include: { category: true },
      }),
      prisma.product.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.inquiry.count({ where: { status: { in: ["QUOTED", "SAMPLE_SENT"] } } }),
      prisma.order.findMany({
        where: { status: "PENDING" },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      }),
      prisma.inquiry.findMany({
        where: { status: "NEW" },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { status: "REQUESTED" },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, companyName: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
        },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: { products: { _count: "desc" } },
      }),
    ])
  );

  const totalRevenue = revenue._sum.totalAmount ?? 0;

  return (
    <div className={styles.dashboardContainer}>
      {/* Telemetry Header */}
      <AdminHeader
        orderCount={orderCount}
        pendingCount={pendingOrdersCount}
      />

      {/* Primary and Operational KPI Matrix */}
      <AdminKpiGrid
        revenue={totalRevenue}
        userCount={userCount}
        orderCount={orderCount}
        pendingOrders={pendingOrdersCount}
        processingOrders={processingOrdersCount}
        bookingCount={bookingCount}
        productCount={totalProductsCount}
      />

      {/* Signature Manufacturing Pipeline Flow */}
      <ProductionPipeline
        counts={{
          newInquiries: newInquiriesCount,
          sampledQuoted: sampledQuotedInquiriesCount,
          pendingOrders: pendingOrdersCount,
          processingOrders: processingOrdersCount,
          shippedOrders: shippedOrdersCount,
          deliveredOrders: deliveredOrdersCount,
        }}
      />

      {/* Two-Column Operational Split: Needs Attention & Inventory Snapshot */}
      <div className={styles.operationalSplitGrid}>
        <NeedsAttentionPanel
          pendingOrders={pendingOrdersList}
          newInquiries={newInquiriesList}
          requestedBookings={requestedBookingsList}
        />
        <InventorySnapshot
          products={products}
          totalCount={totalProductsCount}
          categories={categoriesWithCounts}
        />
      </div>

      {/* Operations Ledger Table */}
      <RecentOperationsFeed orders={recentOrders} />
    </div>
  );
}
