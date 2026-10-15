import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsOrder, OpsOrderItem } from "@/types/ops";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const orderId = params.id;

    // Support both CUID and integer orderNumber query
    const isNumeric = /^\d+$/.test(orderId);

    const order = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            gstNumber: true,
          },
        },
        shippingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                fabric: true,
                gsm: true,
                fit: true,
              },
            },
          },
        },
        stageExecutions: {
          orderBy: { createdAt: "desc" },
        },
        internalNotes: {
          orderBy: { createdAt: "desc" },
        },
        timelineEvents: {
          orderBy: { createdAt: "desc" },
        },
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const latestShipment = order.shipments[0];

    const mappedItems: OpsOrderItem[] = order.items.map((item) => {
      let customState: any = null;
      if (item.customStateJson) {
        try {
          customState = JSON.parse(item.customStateJson);
        } catch {
          customState = null;
        }
      }

      return {
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: customState?.productName || item.product?.name || "Garment",
        productSku: item.product?.sku,
        fabric: customState?.fabric || item.product?.fabric,
        gsm: customState?.gsm || item.product?.gsm,
        fit: customState?.garmentType || item.product?.fit,
        quantity: item.quantity,
        price: item.price,
        customState,
        printFiles: item.printFiles,
        mockupUrl: item.mockupUrl,
        mockupUrlBack: item.mockupUrlBack,
        mockupUrlLeft: item.mockupUrlLeft,
        mockupUrlRight: item.mockupUrlRight,
      };
    });

    const formattedOrder: OpsOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      formattedOrderNumber: `TT-${order.orderNumber}`,
      totalAmount: order.totalAmount,
      amountPaid: order.amountPaid,
      remainingAmount: order.remainingAmount,
      status: order.status,
      opsStage: order.opsStage,
      dueDate: order.dueDate,
      priority: (order.priority as any) || "NORMAL",
      orderSource: order.orderSource,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: {
        id: order.user?.id || "",
        name: order.user?.name,
        email: order.user?.email,
        phone: order.user?.phone,
        companyName: order.user?.companyName,
        gstNumber: order.user?.gstNumber,
      },
      shippingAddress: order.shippingAddress
        ? {
            id: order.shippingAddress.id,
            name: order.shippingAddress.name,
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
          }
        : null,
      items: mappedItems,
      totalQuantity,
      stageExecutions: order.stageExecutions.map((exec) => ({
        id: exec.id,
        orderId: exec.orderId,
        stage: exec.stage,
        status: exec.status,
        iteration: exec.iteration,
        employeeId: exec.employeeId,
        employeeName: exec.employeeName,
        notes: exec.notes,
        metadata: exec.metadata as any,
        attachments: exec.attachments,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        createdAt: exec.createdAt,
      })),
      currentExecution: order.stageExecutions[0]
        ? {
            id: order.stageExecutions[0].id,
            orderId: order.stageExecutions[0].orderId,
            stage: order.stageExecutions[0].stage,
            status: order.stageExecutions[0].status,
            iteration: order.stageExecutions[0].iteration,
            employeeId: order.stageExecutions[0].employeeId,
            employeeName: order.stageExecutions[0].employeeName,
            notes: order.stageExecutions[0].notes,
            metadata: order.stageExecutions[0].metadata as any,
            attachments: order.stageExecutions[0].attachments,
            startedAt: order.stageExecutions[0].startedAt,
            completedAt: order.stageExecutions[0].completedAt,
            createdAt: order.stageExecutions[0].createdAt,
          }
        : null,
      internalNotes: order.internalNotes.map((n) => ({
        id: n.id,
        orderId: n.orderId,
        employeeId: n.employeeId,
        employeeName: n.employeeName,
        note: n.note,
        isPinned: n.isPinned,
        createdAt: n.createdAt,
      })),
      courierName: latestShipment?.courierName || order.bigshipCourierName,
      awbNumber: latestShipment?.awbNumber || order.bigshipTrackingId,
      labelUrl: latestShipment?.labelUrl || order.bigshipLabelUrl,
      manifestUrl: latestShipment?.manifestUrl || order.bigshipManifestUrl,
    };

    return NextResponse.json({
      order: formattedOrder,
      activityEvents: order.timelineEvents.map((e) => ({
        id: e.id,
        orderId: e.orderId,
        eventType: e.eventType,
        title: e.title,
        description: e.description,
        actorId: e.actorId,
        actorName: e.actorName,
        actorRole: e.actorRole,
        metadata: e.metadata as any,
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("[OPS_GET_ORDER_DETAIL_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch order detail" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const orderId = params.id;
    const isNumeric = /^\d+$/.test(orderId);
    const body = await req.json();
    const { dueDate, priority } = body;

    const existingOrder = await prisma.order.findFirst({
      where: isNumeric ? { orderNumber: parseInt(orderId, 10) } : { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        dueDate: true,
        priority: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};
    const auditChanges: Record<string, { from: any; to: any }> = {};

    if (dueDate !== undefined) {
      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      updateData.dueDate = parsedDueDate;
      auditChanges.dueDate = {
        from: existingOrder.dueDate,
        to: parsedDueDate,
      };
    }

    if (priority !== undefined) {
      updateData.priority = priority;
      auditChanges.priority = {
        from: existingOrder.priority,
        to: priority,
      };
    }

    if (Array.isArray(body.newPrintFiles) && body.newPrintFiles.length > 0) {
      const items = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { id: true, printFiles: true },
      });
      for (const it of items) {
        const combined = Array.from(new Set([...it.printFiles, ...body.newPrintFiles]));
        await prisma.orderItem.update({
          where: { id: it.id },
          data: { printFiles: combined },
        });
      }
      auditChanges.printFiles = { from: "previous", to: body.newPrintFiles };
    }

    if (typeof body.removePrintFile === "string" && body.removePrintFile.trim()) {
      const fileToRemove = body.removePrintFile.trim();
      const items = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
        select: { id: true, printFiles: true },
      });
      for (const it of items) {
        const filtered = it.printFiles.filter((f) => f !== fileToRemove);
        await prisma.orderItem.update({
          where: { id: it.id },
          data: { printFiles: filtered },
        });
      }
      auditChanges.removePrintFile = { from: fileToRemove, to: "removed" };
    }

    if (typeof body.newMockupUrl === "string" && body.newMockupUrl.trim()) {
      await prisma.orderItem.updateMany({
        where: { orderId: existingOrder.id },
        data: { mockupUrl: body.newMockupUrl.trim() },
      });
      auditChanges.mockupUrl = { from: "previous", to: body.newMockupUrl };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: existingOrder.id },
        data: updateData,
      });

      await tx.orderTimelineEvent.create({
        data: {
          orderId: existingOrder.id,
          eventType: "OPS_ORDER_METADATA_UPDATED",
          title: "Order Settings Updated",
          description: `Updated by ${auth.context.employee.name}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: auditChanges,
        },
      });

      return ord;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        dueDate: updated.dueDate,
        priority: updated.priority,
      },
    });
  } catch (error: any) {
    console.error("[OPS_PATCH_ORDER_ERROR]", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
