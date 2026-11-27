-- Purely additive: adds missing indexes, no data changes, no column/type changes.
-- Order is the highest-traffic model (every customer dashboard page, the Ops order
-- list/search, Ops dashboard stats, and admin pages all filter on userId/status/
-- opsStage/priority) and previously had no non-unique indexes at all. OrderItem's FK
-- columns (orderId, productId) were likewise unindexed despite being loaded via
-- include:{items} on nearly every order-detail/list query. OtpRequestLog is hit on
-- every OTP send (phone/ip + createdAt lookups) and had no index either.
--
-- NOTE for whoever applies this to production: `CREATE INDEX` (not CONCURRENTLY) takes a
-- brief write lock on the table while building. At the order volumes this business has
-- today that lock is sub-second; if Order/OrderItem ever grow into the hundreds of
-- thousands of rows before this is deployed, re-run the four Order/OrderItem statements
-- individually with `CREATE INDEX CONCURRENTLY` instead (which cannot run inside a
-- transaction — run those via `psql`, not `prisma migrate deploy`, in that case).

CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_opsStage_idx" ON "Order"("opsStage");
CREATE INDEX IF NOT EXISTS "Order_priority_idx" ON "Order"("priority");

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX IF NOT EXISTS "OtpRequestLog_phone_createdAt_idx" ON "OtpRequestLog"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "OtpRequestLog_ip_createdAt_idx" ON "OtpRequestLog"("ip", "createdAt");
