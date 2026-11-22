-- ============================================================
-- CRM Phase 1: 12-stage pipeline, Tasks, Tags
-- ============================================================

-- Migrate Lead.status from the old flat LeadStatus enum to the new LeadStage enum.
-- "HOT" was conflating pipeline stage with lead quality (now derived from score) -> QUALIFIED.
-- "JUNK" -> DISQUALIFIED (closer semantic match in the new pipeline).
ALTER TABLE "Lead" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "status" TYPE TEXT USING ("status"::TEXT);
DROP TYPE "LeadStatus";

CREATE TYPE "LeadStage" AS ENUM ('NEW', 'ATTEMPTING_CONTACT', 'CONTACTED', 'QUALIFIED', 'REQUIREMENT_CAPTURED', 'QUOTATION_IN_PROGRESS', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST', 'NURTURE', 'DISQUALIFIED');

UPDATE "Lead" SET "status" = CASE "status"
  WHEN 'HOT' THEN 'QUALIFIED'
  WHEN 'JUNK' THEN 'DISQUALIFIED'
  ELSE "status"
END;

ALTER TABLE "Lead" ALTER COLUMN "status" TYPE "LeadStage" USING ("status"::"LeadStage");
ALTER TABLE "Lead" ALTER COLUMN "status" SET DEFAULT 'NEW';
ALTER TABLE "Lead" ALTER COLUMN "status" SET NOT NULL;

-- CreateEnum
CREATE TYPE "LeadTaskType" AS ENUM ('FOLLOW_UP_CALL', 'SEND_QUOTATION', 'SEND_WHATSAPP', 'SEND_EMAIL', 'SCHEDULE_MEETING', 'REQUIREMENT_COLLECTION', 'PRICE_NEGOTIATION', 'SAMPLE_FOLLOW_UP', 'PAYMENT_FOLLOW_UP', 'ORDER_CONFIRMATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LeadTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LeadTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable: Lead additions (additive, nullable)
ALTER TABLE "Lead" ADD COLUMN "productCategory" TEXT,
ADD COLUMN "expectedValue" DOUBLE PRECISION,
ADD COLUMN "lostReason" TEXT;

-- CreateTable
CREATE TABLE "LeadTask" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "LeadTaskType" NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "priority" "LeadTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "LeadTaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "createdById" TEXT,
    "completionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTagAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadTask_leadId_idx" ON "LeadTask"("leadId");
CREATE INDEX "LeadTask_assignedToId_idx" ON "LeadTask"("assignedToId");
CREATE INDEX "LeadTask_status_idx" ON "LeadTask"("status");
CREATE INDEX "LeadTask_dueAt_idx" ON "LeadTask"("dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTag_name_key" ON "LeadTag"("name");

-- CreateIndex
CREATE INDEX "LeadTagAssignment_tagId_idx" ON "LeadTagAssignment"("tagId");
CREATE UNIQUE INDEX "LeadTagAssignment_leadId_tagId_key" ON "LeadTagAssignment"("leadId", "tagId");

-- AddForeignKey
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadTask" ADD CONSTRAINT "LeadTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagAssignment" ADD CONSTRAINT "LeadTagAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadTagAssignment" ADD CONSTRAINT "LeadTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LeadTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
