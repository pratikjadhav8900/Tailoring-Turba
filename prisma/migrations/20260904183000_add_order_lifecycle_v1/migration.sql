-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('QUEUED', 'FABRIC_ALLOCATION', 'PRINTING_EMBROIDERY', 'STITCHING', 'QC_INSPECTION', 'PACKED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'MANUAL_BANK_TRANSFER', 'UPI_MANUAL', 'CASH', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('NOT_CREATED', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_ATTEMPT', 'RETURNED_TO_ORIGIN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourierProvider" AS ENUM ('BIGSHIP', 'LOCAL_COURIER', 'DIRECT_PICKUP', 'OTHER');

-- CreateEnum
CREATE TYPE "EventActorRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_WORKER', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'QUALITY_CHECK';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_SHIP';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchOverriddenBy" TEXT,
ADD COLUMN IF NOT EXISTS "dispatchOverrideReason" TEXT,
ADD COLUMN IF NOT EXISTS "productionStage" "ProductionStage" DEFAULT 'QUEUED',
ADD COLUMN IF NOT EXISTS "qcNotes" TEXT,
ADD COLUMN IF NOT EXISTS "qcPassedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "type" "TransactionType" NOT NULL DEFAULT 'PAYMENT',
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "providerSignature" TEXT,
    "failureReason" TEXT,
    "referenceNote" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shipmentNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "provider" "CourierProvider" NOT NULL DEFAULT 'BIGSHIP',
    "courierName" TEXT,
    "awbNumber" TEXT,
    "providerOrderId" TEXT,
    "labelUrl" TEXT,
    "manifestUrl" TEXT,
    "shippingChargePaise" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "dimensionsCm" JSONB,
    "pickupWarehouseId" TEXT,
    "checkpoints" JSONB,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProcessedWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "orderId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderTimelineEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorRole" "EventActorRole" NOT NULL DEFAULT 'SYSTEM_WORKER',
    "isCustomerVisible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutboxNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerPaymentId_key" ON "PaymentTransaction"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_providerPaymentId_idx" ON "PaymentTransaction"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX IF NOT EXISTS "Shipment_awbNumber_idx" ON "Shipment"("awbNumber");
CREATE INDEX IF NOT EXISTS "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProcessedWebhookEvent_provider_eventId_idx" ON "ProcessedWebhookEvent"("provider", "eventId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedWebhookEvent_provider_eventId_key" ON "ProcessedWebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderTimelineEvent_orderId_idx" ON "OrderTimelineEvent"("orderId");
CREATE INDEX IF NOT EXISTS "OrderTimelineEvent_createdAt_idx" ON "OrderTimelineEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "OrderTimelineEvent_isCustomerVisible_idx" ON "OrderTimelineEvent"("isCustomerVisible");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutboxNotification_status_attemptCount_idx" ON "OutboxNotification"("status", "attemptCount");
CREATE INDEX IF NOT EXISTS "OutboxNotification_orderId_idx" ON "OutboxNotification"("orderId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentTransaction_orderId_fkey') THEN
        ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Shipment_orderId_fkey') THEN
        ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderTimelineEvent_orderId_fkey') THEN
        ALTER TABLE "OrderTimelineEvent" ADD CONSTRAINT "OrderTimelineEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OutboxNotification_orderId_fkey') THEN
        ALTER TABLE "OutboxNotification" ADD CONSTRAINT "OutboxNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
