import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  // SECURITY: session-resolved role only. See src/app/api/ops/orders/[id]/stage/route.ts
  // for why the employeeCode/name-based checks this used to also accept were a privilege-
  // escalation hole (Employee.name is self-editable via PATCH /api/ops/account).
  const isManagement =
    auth.context.userRole === "ADMIN" ||
    auth.context.userRole === "SUPER_ADMIN";

  if (!isManagement) {
    return NextResponse.json(
      { error: "Access denied: Workers cannot allocate fabric resources." },
      { status: 403 }
    );
  }

  try {
    const orderId = params.id;
    const isNumeric = /^\d+$/.test(orderId);
    const body = await req.json();

    const {
      vendorId,
      fabricSupplier,
      fabricBatchNumber,
      metersAllocated,
      threadColorCode,
      trimsAllocated,
      notes,
    } = body;

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      include: {
        stageExecutions: {
          where: { stage: "RESOURCE_FABRIC" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Resolve vendor if specified
    let targetVendor = null;
    if (vendorId) {
      targetVendor = await prisma.vendorPartner.findUnique({ where: { id: vendorId } });
    } else if (fabricSupplier) {
      targetVendor = await prisma.vendorPartner.findFirst({
        where: { name: { equals: fabricSupplier.trim(), mode: "insensitive" } },
      });
    }

    const resolvedSupplierName = targetVendor ? targetVendor.name : (fabricSupplier || null);

    const resourceMetadata = {
      fabricSupplier: resolvedSupplierName,
      vendorId: targetVendor?.id || null,
      vendorCode: targetVendor?.code || null,
      fabricBatchNumber: fabricBatchNumber || null,
      metersAllocated: metersAllocated ? parseFloat(metersAllocated) : null,
      threadColorCode: threadColorCode || null,
      trimsAllocated: trimsAllocated || null,
      recordedBy: auth.context.employee.name,
      recordedAt: new Date().toISOString(),
    };

    const latestExecution = order.stageExecutions[0];

    const result = await prisma.$transaction(async (tx) => {
      let execution;
      if (latestExecution) {
        execution = await tx.productionStageExecution.update({
          where: { id: latestExecution.id },
          data: {
            notes: notes || latestExecution.notes,
            metadata: {
              ...((latestExecution.metadata as any) || {}),
              ...resourceMetadata,
            },
          },
        });
      } else {
        execution = await tx.productionStageExecution.create({
          data: {
            orderId: order.id,
            stage: "RESOURCE_FABRIC",
            status: "IN_PROGRESS",
            iteration: 1,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            notes: notes || "Fabric and resources allocated",
            metadata: resourceMetadata,
            startedAt: new Date(),
          },
        });
      }

      // If vendor resolved, create or link external assignment
      if (targetVendor) {
        await tx.externalWorkAssignment.create({
          data: {
            orderId: order.id,
            vendorId: targetVendor.id,
            stage: "RESOURCE_FABRIC",
            stageExecutionId: execution.id,
            assignedById: auth.context.employee.id,
            assignedByName: auth.context.employee.name,
            assignedWorkerId: auth.context.employee.id,
            assignedWorkerName: auth.context.employee.name,
            workType: "RAW_MATERIAL_PROCUREMENT",
            serviceOrProduct: fabricBatchNumber ? `Fabric Batch: ${fabricBatchNumber}` : "Raw Material Fabric",
            quantityRequired: metersAllocated ? Math.round(parseFloat(metersAllocated)) : null,
            status: "ASSIGNED",
            notes: notes || `Procurement from ${targetVendor.name}: ${metersAllocated || "N/A"}m`,
            specifications: {
              fabricBatchNumber: fabricBatchNumber || null,
              metersAllocated: metersAllocated ? parseFloat(metersAllocated) : null,
              threadColorCode: threadColorCode || null,
              trimsAllocated: trimsAllocated || null,
            },
          },
        });
      }

      // Log to timeline
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "OPS_RESOURCE_ALLOCATED",
          title: "Fabric & Resources Allocated",
          description: `Supplier: ${resolvedSupplierName || "N/A"} | Batch: ${fabricBatchNumber || "N/A"} | Meters: ${metersAllocated || "N/A"}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: resourceMetadata,
        },
      });

      return execution;
    });

    return NextResponse.json({ success: true, execution: result });
  } catch (error: any) {
    console.error("[OPS_RESOURCE_ALLOCATION_ERROR]", error);
    return NextResponse.json({ error: "Failed to allocate resources." }, { status: 500 });
  }
}
