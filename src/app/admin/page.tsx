export const dynamic = 'force-dynamic';

import { prisma, withRetry } from "@/lib/prisma";
import AdminHeader from "@/components/admin/dashboard/AdminHeader";
import CurrentFocusBanner from "@/components/admin/dashboard/CurrentFocusBanner";
import AdminKpiGrid from "@/components/admin/dashboard/AdminKpiGrid";
import ProductionPipeline from "@/components/admin/dashboard/ProductionPipeline";
import CurrentOrdersWorkspace from "@/components/admin/dashboard/CurrentOrdersWorkspace";
import NeedsAttentionPanel from "@/components/admin/dashboard/NeedsAttentionPanel";
import RecentOperationsFeed from "@/components/admin/dashboard/RecentOperationsFeed";
import InventorySnapshot from "@/components/admin/dashboard/InventorySnapshot";
import styles from "./page.module.css";

export default async function AdminDashboard() {
  const [
    userCount,
    orderCount,
    bookingCount,
    products,
    totalProductsCount,
    revenue,
    realizedOrderCount,
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
      // "Total Revenue" must reflect orders that were actually confirmed/paid, not every
      // abandoned-checkout (PENDING) or CANCELLED order's full value.
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ["PENDING", "CANCELLED"] } },
      }),
      prisma.order.count({ where: { status: { notIn: ["PENDING", "CANCELLED"] } } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.inquiry.count({ where: { status: { in: ["QUOTED", "SAMPLE_SENT"] } } }),
      prisma.order.findMany({
        where: { status: "PENDING" },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, companyName: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, gsm: true } },
            },
          },
        },
      }),
      prisma.inquiry.findMany({
        where: { status: "NEW" },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        where: { status: "REQUESTED" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, companyName: true, phone: true } },
          shippingAddress: { select: { city: true, state: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, gsm: true } },
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
  const firstPendingOrder = pendingOrdersList[0] || null;
  const firstNewInquiry = newInquiriesList[0] || null;

  return (
    <div className={styles.dashboardContainer}>
      {/* Telemetry Header */}
      <AdminHeader
        pendingCount={pendingOrdersCount}
      />

      {/* Operational Current Focus Banner */}
      <CurrentFocusBanner
        pendingCount={pendingOrdersCount}
        newInquiriesCount={newInquiriesCount}
        firstPendingOrder={firstPendingOrder}
        firstNewInquiry={firstNewInquiry}
      />

      {/* Primary and Operational KPI Matrix */}
      <AdminKpiGrid
        revenue={totalRevenue}
        realizedOrderCount={realizedOrderCount}
        userCount={userCount}
        orderCount={orderCount}
        pendingOrders={pendingOrdersCount}
        processingOrders={processingOrdersCount}
        bookingCount={bookingCount}
        productCount={totalProductsCount}
      />

      {/* Signature Manufacturing Pipeline Flow (Timeline Rail) */}
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

      {/* Dominant Live Order Workspace Table */}
      <CurrentOrdersWorkspace
        orders={recentOrders}
        totalOrdersCount={orderCount}
      />

      {/* Two-Column Operational Split: Needs Attention & Recent Activity */}
      <div className={styles.operationalSplitGrid}>
        <NeedsAttentionPanel
          pendingOrders={pendingOrdersList}
          newInquiries={newInquiriesList}
          requestedBookings={requestedBookingsList}
        />
        <RecentOperationsFeed 
          orders={recentOrders} 
          newInquiries={newInquiriesList}
        />
      </div>

      {/* Inventory & Secondary Operations Snapshot */}
      <div className={styles.inventorySectionWrap}>
        <InventorySnapshot
          products={products}
          totalCount={totalProductsCount}
          categories={categoriesWithCounts}
        />
      </div>
    </div>
  );
}
