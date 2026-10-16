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

  const isManagement =
    auth.context.userRole === "ADMIN" ||
    auth.context.userRole === "SUPER_ADMIN" ||
    ["TT001", "TT002", "TT003"].includes(auth.context.employee.employeeCode) ||
    auth.context.employee.name.includes("Pratik") ||
    auth.context.employee.name.includes("Neeraj") ||
    auth.context.employee.name.includes("Sanjay");

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

    const resourceMetadata = {
      fabricSupplier: fabricSupplier || null,
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

      // Log to timeline
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "OPS_RESOURCE_ALLOCATED",
          title: "Fabric & Resources Allocated",
          description: `Supplier: ${fabricSupplier || "N/A"} | Batch: ${fabricBatchNumber || "N/A"} | Meters: ${metersAllocated || "N/A"}`,
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
