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
    const source = searchParams.get("source");
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

    // Filter by lead source (e.g. WHATSAPP, NATURAL, WEBSITE, PHONE, INSTAGRAM)
    if (source && source !== "ALL") {
      where.orderSource = source;
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

        const customGarmentName = customState?.productName || item.product?.name || "Garment";

        return {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: customGarmentName,
          productSku: item.product?.sku,
          fabric: customState?.fabric || item.product?.fabric,
          gsm: customState?.gsm || item.product?.gsm,
          fit: customState?.fit || item.product?.fit,
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
      customerCompanyName,
      customerGstNumber,
      shippingAddress, // { name, street, city, state, postalCode, country }
      items,
      dueDate,
      priority = "NORMAL",
      orderSource = "WHATSAPP", // Lead Source: WHATSAPP, NATURAL, WEBSITE, PHONE, INSTAGRAM, REFERRAL, etc.
      initialStage = "NEW_ORDER",
      amountPaid = 0,
      totalAmount: customTotalAmount,
      internalNote,
      productionAssets = [],
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one product item is required to create an order." },
        { status: 400 }
      );
    }

    // 1. Resolve or find/create User for the customer
    let targetUserId = customerId;
    if (!targetUserId) {
      let existingUser = null;
      if (customerPhone) {
        existingUser = await prisma.user.findFirst({
          where: { phone: customerPhone.trim() },
        });
      }
      if (!existingUser && customerEmail) {
        existingUser = await prisma.user.findFirst({
          where: { email: { equals: customerEmail.trim(), mode: "insensitive" } },
        });
      }

      if (existingUser) {
        targetUserId = existingUser.id;
        // Enrich user info if newly provided
        const updateData: any = {};
        if (customerCompanyName && !existingUser.companyName) updateData.companyName = customerCompanyName.trim();
        if (customerGstNumber && !existingUser.gstNumber) updateData.gstNumber = customerGstNumber.trim();
        if (customerName && existingUser.name === "Customer") updateData.name = customerName.trim();
        if (customerPhone && !existingUser.phone) updateData.phone = customerPhone.trim();
        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
        }
      } else {
        const phoneClean = customerPhone ? customerPhone.replace(/\D/g, "") : "";
        const fallbackEmail = customerEmail && customerEmail.trim()
          ? customerEmail.trim().toLowerCase()
          : `direct-${phoneClean || Date.now()}@orders.tailoringturba.com`;

        const newUser = await prisma.user.create({
          data: {
            email: fallbackEmail,
            name: customerName?.trim() || "B2B Customer",
            phone: customerPhone?.trim() || null,
            companyName: customerCompanyName?.trim() || null,
            gstNumber: customerGstNumber?.trim() || null,
            role: "USER",
          },
        });
        targetUserId = newUser.id;
      }
    }

    if (!targetUserId) {
      targetUserId = auth.context.userId;
    }

    // 2. Resolve default product fallback for relational integrity
    const fallbackProduct = await prisma.product.findFirst({
      select: { id: true, name: true, basePrice: true },
    });

    if (!fallbackProduct) {
      return NextResponse.json(
        { error: "No products exist in database to link order items." },
        { status: 500 }
      );
    }

    // 3. Calculate total quantity and amount
    const totalQuantity = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
    const computedTotalAmount = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );
    const finalTotalAmount = customTotalAmount !== undefined && customTotalAmount !== null && Number(customTotalAmount) > 0
      ? Number(customTotalAmount)
      : computedTotalAmount;

    const parsedAmountPaid = Math.max(0, Number(amountPaid) || 0);
    const remainingAmount = Math.max(0, finalTotalAmount - parsedAmountPaid);

    // 4. Compute delivery date
    let finalDueDate: Date | null = null;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
    } else {
      const { maxDays } = getEstimatedDeliveryDays(totalQuantity);
      finalDueDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    }

    // 5. Handle shipping address if provided
    let shippingAddressId: string | null = null;
    if (shippingAddress && (shippingAddress.street || shippingAddress.city)) {
      const addr = await prisma.address.create({
        data: {
          userId: targetUserId,
          name: shippingAddress.name || customerName || "Customer",
          street: shippingAddress.street || "",
          city: shippingAddress.city || "",
          state: shippingAddress.state || "",
          postalCode: shippingAddress.postalCode || "",
          country: shippingAddress.country || "India",
          updatedAt: new Date(),
        },
      });
      shippingAddressId = addr.id;
    }

    // 6. Transactionally create Order, OrderItems, Stage Execution, Timeline & Notification
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: targetUserId,
          totalAmount: finalTotalAmount,
          status: parsedAmountPaid >= finalTotalAmount ? "CONFIRMED" : "PENDING",
          amountPaid: parsedAmountPaid,
          remainingAmount,
          isSplitPayment: parsedAmountPaid > 0 && remainingAmount > 0,
          shippingAddressId,
          opsStage: initialStage || "NEW_ORDER",
          orderSource: orderSource.trim().toUpperCase(),
          dueDate: finalDueDate,
          priority: priority || "NORMAL",
          items: {
            create: items.map((it: any) => {
              const itemProductId = it.productId || fallbackProduct.id;
              const customState = {
                productName: it.productName || it.name || "Custom Garment",
                sizes: it.sizeBreakdown || it.sizes || null,
                fabric: it.fabric || null,
                brand: it.brand || null,
                garmentType: it.garmentType || null,
                color: it.color || null,
                logoRequired: it.logoRequired ?? null,
                logoName: it.logoName || null,
                logoType: it.logoType || null,
                logoPosition: it.logoPosition || null,
                sizeRange: it.sizeRange || null,
                sizeNote: it.sizeNote || null,
                branding: it.branding || null,
                notes: it.notes || it.sizeNote || null,
              };

              return {
                productId: itemProductId,
                quantity: Number(it.quantity) || 1,
                price: Number(it.price) || 0,
                customStateJson: JSON.stringify(customState),
                printFiles:
                  Array.isArray(it.printFiles) && it.printFiles.length > 0
                    ? it.printFiles
                    : Array.isArray(productionAssets)
                    ? productionAssets
                    : [],
                mockupUrl: it.mockupUrl || null,
              };
            }),
          },
        },
      });

      // Record initial stage execution
      await tx.productionStageExecution.create({
        data: {
          orderId: order.id,
          stage: initialStage || "NEW_ORDER",
          status: "IN_PROGRESS",
          iteration: 1,
          employeeId: auth.context.employee.id,
          employeeName: auth.context.employee.name,
          notes: `Order created via Turba Ops (${orderSource.toUpperCase()} intake)`,
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
            isPinned: true,
          },
        });
      }

      // Order timeline audit log
      await tx.orderTimelineEvent.create({
        data: {
          orderId: order.id,
          eventType: "OPS_ORDER_CREATED",
          title: `Order TT-${order.orderNumber} Created`,
          description: `Direct intake recorded by ${auth.context.employee.name} via ${orderSource.toUpperCase()}`,
          actorId: auth.context.employee.id,
          actorName: auth.context.employee.name,
          actorRole: "EMPLOYEE",
          isCustomerVisible: false,
          metadata: {
            orderSource: orderSource.toUpperCase(),
            totalQuantity,
            totalAmount: finalTotalAmount,
            amountPaid: parsedAmountPaid,
            remainingAmount,
            priority,
            productionAssets: Array.isArray(productionAssets) ? productionAssets : [],
          },
        },
      });

      // Broadcast team notification
      await tx.opsNotification.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          type: "ORDER_CREATED",
          title: `New Order TT-${order.orderNumber} (${orderSource.toUpperCase()})`,
          message: `Direct order TT-${order.orderNumber} (${totalQuantity} pcs) entered by ${auth.context.employee.name}`,
          actorName: auth.context.employee.name,
          readBy: [auth.context.employee.id],
          metadata: {
            isNewOrder: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
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
        totalAmount: newOrder.totalAmount,
        amountPaid: newOrder.amountPaid,
        remainingAmount: newOrder.remainingAmount,
      },
    });
  } catch (error: any) {
    console.error("[OPS_CREATE_ORDER_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to create manual order" }, { status: 500 });
  }
}
