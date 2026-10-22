import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsProductionStage, AssignmentStatus } from "@/types/ops";

export const dynamic = "force-dynamic";

// Stages where external vendor/partner selection is mandatory
const EXTERNAL_WORK_STAGES: OpsProductionStage[] = [
  "RESOURCE_FABRIC",
  "CUTTING",
  "STITCHING",
  "BRANDING_PRINTING",
];

/**
 * GET /api/ops/assignments
 * List external work assignments.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const vendorId = searchParams.get("vendorId");
    const stage = searchParams.get("stage") as OpsProductionStage | null;
    const status = searchParams.get("status") as AssignmentStatus | null;
    const workerId = searchParams.get("workerId");

    const where: any = {};
    if (orderId) {
      const isNumeric = /^\d+$/.test(orderId);
      if (isNumeric) {
        where.order = { orderNumber: parseInt(orderId, 10) };
      } else {
        where.orderId = orderId;
      }
    }
    if (vendorId) where.vendorId = vendorId;
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (workerId) where.assignedWorkerId = workerId;

    const assignments = await prisma.externalWorkAssignment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            opsStage: true,
            priority: true,
            dueDate: true,
            user: {
              select: { name: true, companyName: true, phone: true },
            },
            items: {
              select: {
                id: true,
                quantity: true,
                customStateJson: true,
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            location: true,
            category: true,
            services: true,
          },
        },
        assignedWorker: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            roleTitle: true,
          },
        },
        goodsMovements: {
          orderBy: { movementDate: "desc" },
        },
      },
    });

    const formatted = assignments.map((a) => {
      const pendingQuantity = Math.max(0, a.quantitySent - a.quantityReceived);
      return {
        id: a.id,
        orderId: a.orderId,
        orderNumber: a.order.orderNumber,
        formattedOrderNumber: `TT-${a.order.orderNumber}`,
        stage: a.stage,
        vendorId: a.vendorId,
        vendorName: a.vendor.name,
        vendorCode: a.vendor.code,
        vendorPhone: a.vendor.phone,
        vendorLocation: a.vendor.location,
        assignedById: a.assignedById,
        assignedByName: a.assignedByName,
        assignedWorkerId: a.assignedWorkerId,
        assignedWorkerName: a.assignedWorkerName || a.assignedWorker?.name || null,
        workType: a.workType,
        serviceOrProduct: a.serviceOrProduct,
        quantityRequired: a.quantityRequired,
        quantitySent: a.quantitySent,
        quantityReceived: a.quantityReceived,
        pendingQuantity,
        expectedDeliveryDate: a.expectedDeliveryDate,
        status: a.status,
        notes: a.notes,
        specifications: a.specifications as Record<string, unknown> | null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        orderCustomer: a.order.user?.name || "Customer",
        orderCompany: a.order.user?.companyName || null,
        orderPriority: a.order.priority || "NORMAL",
        goodsMovements: a.goodsMovements,
      };
    });

    return NextResponse.json({
      success: true,
      assignments: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("[OPS_GET_ASSIGNMENTS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch assignments." }, { status: 500 });
  }
}

/**
 * POST /api/ops/assignments
 * Create an external vendor work assignment.
 * Authorized: Neeraj, Pratik, Sanjay, or ADMIN/SUPER_ADMIN.
 */
export async function POST(req: NextRequest) {
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
      { error: "Access denied: Only factory management (Neeraj, Pratik, Sanjay) can assign external work." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      orderId,
      vendorId,
      stage,
      assignedWorkerId,
      workType,
      serviceOrProduct,
      quantityRequired,
      quantitySent = 0,
      expectedDeliveryDate,
      notes,
      specifications,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const isNumeric = /^\d+$/.test(orderId);
    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      include: { user: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const targetStage = (stage || order.opsStage || "RESOURCE_FABRIC") as OpsProductionStage;

    // Validate mandatory vendor selection for external work stages
    if (EXTERNAL_WORK_STAGES.includes(targetStage) && !vendorId) {
      return NextResponse.json(
        { error: `Vendor/Partner selection is mandatory for stage "${targetStage.replace(/_/g, " ")}".` },
        { status: 400 }
      );
    }

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
    }

    const vendor = await prisma.vendorPartner.findUnique({
      where: { id: vendorId },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Selected Vendor/Partner does not exist." }, { status: 404 });
    }

    // Resolve assigned internal worker if specified
    let workerName: string | null = null;
    if (assignedWorkerId) {
      const worker = await prisma.employee.findUnique({
        where: { id: assignedWorkerId },
      });
      if (worker) {
        workerName = worker.name;
      }
    }

    const initialQuantitySent = Number.isInteger(quantitySent) && quantitySent > 0 ? quantitySent : 0;
    const initialStatus = initialQuantitySent > 0 ? "SENT_TO_PARTNER" : "ASSIGNED";

    const parsedExpectedDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ExternalWorkAssignment
      const assignment = await tx.externalWorkAssignment.create({
        data: {
          orderId: order.id,
          vendorId: vendor.id,
          stage: targetStage,
          assignedById: auth.context.employee.id,
          assignedByName: auth.context.employee.name,
          assignedWorkerId: assignedWorkerId || null,
          assignedWorkerName: workerName,
          workType: workType || "OUTSOURCED_PRODUCTION",
          serviceOrProduct: serviceOrProduct || null,
          quantityRequired: quantityRequired ? parseInt(quantityRequired, 10) : null,
          quantitySent: initialQuantitySent,
          quantityReceived: 0,
          expectedDeliveryDate: parsedExpectedDate,
          status: initialStatus,
          notes: notes?.trim() || null,
          specifications: specifications || null,
        },
      });

      // 2. If quantitySent was given, create initial Outward movement
      if (initialQuantitySent > 0) {
        await tx.goodsMovement.create({
          data: {
            assignmentId: assignment.id,
            orderId: order.id,
            vendorId: vendor.id,
            movementType: "OUTWARD_CHALLAN",
            quantity: initialQuantitySent,
            movementDate: new Date(),
            actorEmployeeId: auth.context.employee.id,
            actorEmployeeName: auth.context.employee.name,
            notes: notes || "Initial dispatch to partner",
          },
        });
      }

      // 3. Create Timeline Event
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "VENDOR_ASSIGNED",
          title: `Partner Assigned: ${vendor.name} (${targetStage.replace(/_/g, " ")})`,
          description: `${auth.context.employee.name} assigned external partner ${vendor.name}${vendor.code ? ` [${vendor.code}]` : ""}${workerName ? ` with internal worker ${workerName}` : ""}. Service: ${serviceOrProduct || workType || "Production"}.${notes ? ` Note: "${notes}"` : ""}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            assignmentId: assignment.id,
            vendorId: vendor.id,
            vendorName: vendor.name,
            vendorCode: vendor.code,
            stage: targetStage,
            workerName,
            quantitySent: initialQuantitySent,
            expectedDeliveryDate: parsedExpectedDate,
          },
        },
      });

      // 4. Create Notification
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: "VENDOR_ASSIGNED",
          title: `Partner Assigned: ${vendor.name} (TT-${order.orderNumber})`,
          message: `${auth.context.employee.name} assigned ${vendor.name} for ${targetStage.replace(/_/g, " ")}. Qty: ${initialQuantitySent || quantityRequired || "TBD"}`,
          actorName: auth.context.employee.name,
          readBy: [],
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            vendorName: vendor.name,
            stage: targetStage,
          },
        },
      });

      return assignment;
    });

    return NextResponse.json({
      success: true,
      assignment: result,
      message: `Assigned ${vendor.name} to Order TT-${order.orderNumber} successfully.`,
    });
  } catch (error: any) {
    console.error("[OPS_CREATE_ASSIGNMENT_ERROR]", error);
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}
