-- CreateEnum
CREATE TYPE "OpsProductionStage" AS ENUM ('NEW_ORDER', 'ORDER_CONFIRMED', 'RESOURCE_FABRIC', 'CUTTING', 'STITCHING', 'BRANDING_PRINTING', 'QUALITY_CHECK', 'PACKING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OpsStageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED_REWORK');

-- AlterEnum
ALTER TYPE "EventActorRole" ADD VALUE 'EMPLOYEE';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "opsStage" "OpsProductionStage",
ADD COLUMN     "orderSource" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "roleTitle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionStageExecution" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stage" "OpsProductionStage" NOT NULL,
    "status" "OpsStageStatus" NOT NULL DEFAULT 'PENDING',
    "iteration" INTEGER NOT NULL DEFAULT 1,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionStageExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalOrderNote" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalOrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "ProductionStageExecution_orderId_idx" ON "ProductionStageExecution"("orderId");

-- CreateIndex
CREATE INDEX "ProductionStageExecution_stage_idx" ON "ProductionStageExecution"("stage");

-- CreateIndex
CREATE INDEX "InternalOrderNote_orderId_idx" ON "InternalOrderNote"("orderId");

-- CreateIndex
CREATE INDEX "OpsNotification_createdAt_idx" ON "OpsNotification"("createdAt");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStageExecution" ADD CONSTRAINT "ProductionStageExecution_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionStageExecution" ADD CONSTRAINT "ProductionStageExecution_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalOrderNote" ADD CONSTRAINT "InternalOrderNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalOrderNote" ADD CONSTRAINT "InternalOrderNote_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
