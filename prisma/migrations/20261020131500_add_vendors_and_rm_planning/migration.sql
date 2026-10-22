-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('RAW_MATERIAL_SUPPLIER', 'FINISHED_GOODS_SUPPLIER', 'TAILOR_MANUFACTURER', 'PRINTING_EMBROIDERY_PARTNER');

-- CreateEnum
CREATE TYPE "PartnerService" AS ENUM ('SCREEN_PRINTING', 'DTF_PRINTING', 'SUBLIMATION', 'UV_PRINTING', 'EMBROIDERY', 'STITCHING', 'FABRIC_SUPPLY', 'FINISHED_GOODS_SUPPLY');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'ASSIGNED', 'SENT_TO_PARTNER', 'IN_PROGRESS', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED', 'DELAYED');

-- CreateEnum
CREATE TYPE "GoodsMovementType" AS ENUM ('OUTWARD_CHALLAN', 'INWARD_RECEIPT');

-- CreateTable
CREATE TABLE "VendorPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "partnerTypes" "PartnerType"[] DEFAULT ARRAY[]::"PartnerType"[],
    "services" "PartnerService"[] DEFAULT ARRAY[]::"PartnerService"[],
    "category" TEXT,
    "subcategory" TEXT,
    "products" TEXT,
    "location" TEXT,
    "normalizedLocation" TEXT,
    "contactPersons" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "panNumber" TEXT,
    "gstNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceNotes" TEXT,
    "internalNotes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalWorkAssignment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "stage" "OpsProductionStage" NOT NULL,
    "stageExecutionId" TEXT,
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "assignedWorkerId" TEXT,
    "assignedWorkerName" TEXT,
    "workType" TEXT NOT NULL,
    "serviceOrProduct" TEXT,
    "quantityRequired" INTEGER,
    "quantitySent" INTEGER NOT NULL DEFAULT 0,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "expectedDeliveryDate" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalWorkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsMovement" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "movementType" "GoodsMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discrepancyQuantity" INTEGER NOT NULL DEFAULT 0,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmployeeId" TEXT,
    "actorEmployeeName" TEXT NOT NULL,
    "notes" TEXT,
    "conditionNotes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialConsumptionReference" (
    "id" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "sizeBand" TEXT NOT NULL,
    "fabric" TEXT NOT NULL,
    "gsm" TEXT,
    "unitKg" DOUBLE PRECISION,
    "unitsPerKg" DOUBLE PRECISION,
    "sourceQuantity" INTEGER,
    "sourceFabricRequiredKg" DOUBLE PRECISION,
    "supplierBrandNote" TEXT,
    "sourceDocument" TEXT NOT NULL DEFAULT 'Manufacturing(RM).pdf',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialConsumptionReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPartner_code_key" ON "VendorPartner"("code");

-- CreateIndex
CREATE INDEX "VendorPartner_name_idx" ON "VendorPartner"("name");
CREATE INDEX "VendorPartner_code_idx" ON "VendorPartner"("code");
CREATE INDEX "VendorPartner_location_idx" ON "VendorPartner"("location");
CREATE INDEX "VendorPartner_isActive_idx" ON "VendorPartner"("isActive");

-- CreateIndex
CREATE INDEX "ExternalWorkAssignment_orderId_idx" ON "ExternalWorkAssignment"("orderId");
CREATE INDEX "ExternalWorkAssignment_vendorId_idx" ON "ExternalWorkAssignment"("vendorId");
CREATE INDEX "ExternalWorkAssignment_stage_idx" ON "ExternalWorkAssignment"("stage");
CREATE INDEX "ExternalWorkAssignment_status_idx" ON "ExternalWorkAssignment"("status");

-- CreateIndex
CREATE INDEX "GoodsMovement_assignmentId_idx" ON "GoodsMovement"("assignmentId");
CREATE INDEX "GoodsMovement_orderId_idx" ON "GoodsMovement"("orderId");
CREATE INDEX "GoodsMovement_vendorId_idx" ON "GoodsMovement"("vendorId");
CREATE INDEX "GoodsMovement_movementDate_idx" ON "GoodsMovement"("movementDate");

-- CreateIndex
CREATE INDEX "MaterialConsumptionReference_productType_fabric_idx" ON "MaterialConsumptionReference"("productType", "fabric");
CREATE INDEX "MaterialConsumptionReference_sizeBand_idx" ON "MaterialConsumptionReference"("sizeBand");

-- AddForeignKey
ALTER TABLE "ExternalWorkAssignment" ADD CONSTRAINT "ExternalWorkAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalWorkAssignment" ADD CONSTRAINT "ExternalWorkAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalWorkAssignment" ADD CONSTRAINT "ExternalWorkAssignment_assignedWorkerId_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsMovement" ADD CONSTRAINT "GoodsMovement_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ExternalWorkAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsMovement" ADD CONSTRAINT "GoodsMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsMovement" ADD CONSTRAINT "GoodsMovement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
