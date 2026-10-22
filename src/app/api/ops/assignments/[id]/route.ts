import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/assignments/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const assignment = await prisma.externalWorkAssignment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            opsStage: true,
            priority: true,
            dueDate: true,
            user: { select: { name: true, companyName: true, phone: true } },
          },
        },
        vendor: true,
        assignedWorker: {
          select: { id: true, name: true, employeeCode: true, roleTitle: true },
        },
        goodsMovements: {
          orderBy: { movementDate: "desc" },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const pendingQuantity = Math.max(0, assignment.quantitySent - assignment.quantityReceived);

    return NextResponse.json({
      success: true,
      assignment: {
        ...assignment,
        pendingQuantity,
      },
    });
  } catch (error: any) {
    console.error("[OPS_GET_ASSIGNMENT_DETAIL_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch assignment." }, { status: 500 });
  }
}

/**
 * PATCH /api/ops/assignments/[id]
 * Update status, expected dates, or explicitly reassign vendor (with logged audit trail).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await req.json();
    const {
      status,
      vendorId,
      assignedWorkerId,
      expectedDeliveryDate,
      notes,
      serviceOrProduct,
      reassignmentReason,
    } = body;

    const existing = await prisma.externalWorkAssignment.findUnique({
      where: { id },
      include: {
        vendor: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    let newVendor = existing.vendor;
    let vendorChanged = false;

    if (vendorId && vendorId !== existing.vendorId) {
      const found = await prisma.vendorPartner.findUnique({ where: { id: vendorId } });
      if (!found) {
        return NextResponse.json({ error: "Target vendor does not exist." }, { status: 404 });
      }
      newVendor = found;
      vendorChanged = true;
    }

    let newWorkerName = existing.assignedWorkerName;
    if (assignedWorkerId !== undefined) {
      if (assignedWorkerId) {
        const worker = await prisma.employee.findUnique({ where: { id: assignedWorkerId } });
        newWorkerName = worker?.name || null;
      } else {
        newWorkerName = null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.externalWorkAssignment.update({
        where: { id },
        data: {
          vendorId: newVendor.id,
          status: status || existing.status,
          assignedWorkerId: assignedWorkerId !== undefined ? assignedWorkerId : existing.assignedWorkerId,
          assignedWorkerName: newWorkerName,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : existing.expectedDeliveryDate,
          notes: notes !== undefined ? notes : existing.notes,
          serviceOrProduct: serviceOrProduct !== undefined ? serviceOrProduct : existing.serviceOrProduct,
        },
      });

      // If vendor was changed, record explicit audit timeline event
      if (vendorChanged) {
        await tx.orderTimelineEvent.create({
          data: {
            orderId: existing.order.id,
            eventType: "VENDOR_REASSIGNED",
            title: `Partner Reassigned: ${existing.vendor.name} → ${newVendor.name}`,
            description: `${auth.context.employee.name} reassigned work for stage ${existing.stage} from ${existing.vendor.name} to ${newVendor.name}.${reassignmentReason ? ` Reason: "${reassignmentReason}"` : ""}`,
            actorId: auth.context.employee.id,
            actorName: auth.context.employee.name,
            actorRole: "EMPLOYEE",
            isCustomerVisible: false,
            metadata: {
              previousVendorId: existing.vendor.id,
              previousVendorName: existing.vendor.name,
              newVendorId: newVendor.id,
              newVendorName: newVendor.name,
              stage: existing.stage,
              reassignmentReason,
            },
          },
        });
      }

      return updatedAssignment;
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: "Assignment updated successfully.",
    });
  } catch (error: any) {
    console.error("[OPS_UPDATE_ASSIGNMENT_ERROR]", error);
    return NextResponse.json({ error: "Failed to update assignment." }, { status: 500 });
  }
}
