-- WhatsApp broadcasting (Meta WhatsApp Cloud API). Purely additive: one new
-- nullable/defaulted column on Lead, two new enums, two new tables.
ALTER TABLE "Lead" ADD COLUMN "whatsappOptOut" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "WhatsAppBroadcastStatus" AS ENUM ('SENDING', 'SENT', 'PARTIAL', 'FAILED');

CREATE TYPE "WhatsAppRecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

CREATE TABLE "WhatsAppBroadcast" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateLanguage" TEXT NOT NULL,
    "templateCategory" TEXT,
    "variables" JSONB,
    "audienceFilter" JSONB NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "status" "WhatsAppBroadcastStatus" NOT NULL DEFAULT 'SENDING',
    "errorMessage" TEXT,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBroadcast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppBroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "leadId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "WhatsAppRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "waMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppBroadcastRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppBroadcast_createdAt_idx" ON "WhatsAppBroadcast"("createdAt");
CREATE INDEX "WhatsAppBroadcast_status_idx" ON "WhatsAppBroadcast"("status");

CREATE INDEX "WhatsAppBroadcastRecipient_broadcastId_idx" ON "WhatsAppBroadcastRecipient"("broadcastId");
CREATE INDEX "WhatsAppBroadcastRecipient_status_idx" ON "WhatsAppBroadcastRecipient"("status");
CREATE INDEX "WhatsAppBroadcastRecipient_waMessageId_idx" ON "WhatsAppBroadcastRecipient"("waMessageId");

ALTER TABLE "WhatsAppBroadcast" ADD CONSTRAINT "WhatsAppBroadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsAppBroadcastRecipient" ADD CONSTRAINT "WhatsAppBroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "WhatsAppBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WhatsAppBroadcastRecipient" ADD CONSTRAINT "WhatsAppBroadcastRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
