import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import type { OpsOrder, OpsOrderItem, OpsProductionStage } from "@/types/ops";
import { getEstimatedDeliveryDays } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") as OpsProductionStage | "ALL" | "ACTIVE" | null;
    const priority = searchParams.get("priority");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by stage
    if (stage && stage !== "ALL") {
      if (stage === "ACTIVE") {
        where.opsStage = { not: null, notIn: ["CLOSED"] };
      } else {
        where.opsStage = stage;
      }
    }

    // Filter by priority
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    // Search by orderNumber, customer name, email, or phone
    if (search) {
      const numericOrderNumber = parseInt(search.replace(/\D/g, ""), 10);
      where.OR = [
        ...(isNaN(numericOrderNumber) ? [] : [{ orderNumber: numericOrderNumber }]),
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
        { user: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
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
            take: 1,
          },
          internalNotes: {
            orderBy: { createdAt: "desc" },
          },
          shipments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const formattedOrders: OpsOrder[] = orders.map((order) => {
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
          productName: item.product?.name || "Garment",
          productSku: item.product?.sku,
          fabric: item.product?.fabric,
          gsm: item.product?.gsm,
          fit: item.product?.fit,
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

      return {
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
    });

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("[OPS_GET_ORDERS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      customerId,
      customerEmail,
      customerName,
      customerPhone,
      items,
      dueDate,
      priority = "NORMAL",
      internalNote,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one product item is required to create an order." },
        { status: 400 }
      );
    }

    // Resolve or find User for the order
    let targetUserId = customerId;
    if (!targetUserId && customerEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: customerEmail },
      });
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: customerEmail,
            name: customerName || "Customer",
            phone: customerPhone,
            role: "USER",
          },
        });
        targetUserId = newUser.id;
      }
    }

    if (!targetUserId) {
      // Fallback: assign to the current employee user if no customer specified
      targetUserId = auth.context.userId;
    }

    // Calculate total quantity and amount
    const totalQuantity = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
    const totalAmount = items.reduce(
      (sum: number, it: any) => sum + (it.price || 0) * (it.quantity || 1),
      0
    );

    // Compute placeholder dueDate if not explicitly provided
    let finalDueDate: Date | null = null;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
    } else {
      const { maxDays } = getEstimatedDeliveryDays(totalQuantity);
      finalDueDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    }

    // Transactionally create Order, Items, initial Stage Execution, and Timeline
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: targetUserId,
          totalAmount,
          status: "CONFIRMED",
          amountPaid: 0,
          remainingAmount: totalAmount,
          // CRITICAL REQUIREMENT: Explicitly set opsStage to NEW_ORDER and orderSource to MANUAL_OPS
          opsStage: "NEW_ORDER",
          orderSource: "MANUAL_OPS",
          dueDate: finalDueDate,
          priority: priority || "NORMAL",
          items: {
            create: items.map((it: any) => ({
              productId: it.productId,
              quantity: it.quantity || 1,
              price: it.price || 0,
              customStateJson: it.customState ? JSON.stringify(it.customState) : null,
              printFiles: it.printFiles || [],
              mockupUrl: it.mockupUrl || null,
            })),
          },
        },
      });

      // Record initial stage execution
      await tx.productionStageExecution.create({
        data: {
          orderId: order.id,
          stage: "NEW_ORDER",
          status: "IN_PROGRESS",
          iteration: 1,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
          notes: "Manual order created via Turba Ops",
          startedAt: new Date(),
        },
      });

      // Internal note if provided
      if (internalNote && internalNote.trim()) {
        await tx.internalOrderNote.create({
          data: {
            orderId: order.id,
            employeeId: auth.context.employee.id,
            employeeName: auth.context.employee.name,
            note: internalNote.trim(),
          },
        });
      }

      // Order timeline audit log
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "OPS_ORDER_CREATED",
          title: "Order Created in Turba Ops",
          description: `Order TT-${order.orderNumber} manually entered by ${auth.context.employee.name}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            orderSource: "MANUAL_OPS",
            totalQuantity,
            totalAmount,
            priority,
          },
        },
      });

      // Broadcast team notification
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: "STAGE_CHANGE",
          title: `New Order TT-${order.orderNumber}`,
          message: `Order TT-${order.orderNumber} entered into New Order by ${auth.context.employee.name}`,
          actorName: auth.context.employee.name,
          readBy: [auth.context.employee.id], // Creator already acknowledged
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        formattedOrderNumber: `TT-${newOrder.orderNumber}`,
        opsStage: newOrder.opsStage,
        orderSource: newOrder.orderSource,
      },
    });
  } catch (error: any) {
    console.error("[OPS_CREATE_ORDER_ERROR]", error);
    return NextResponse.json({ error: "Failed to create manual order" }, { status: 500 });
  }
}
