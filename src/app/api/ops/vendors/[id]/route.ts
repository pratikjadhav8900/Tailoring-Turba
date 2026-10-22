import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/vendors/[id]
 * Retrieve single vendor with all related assignments and movements.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const vendor = await prisma.vendorPartner.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { createdAt: "desc" },
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                opsStage: true,
                priority: true,
                dueDate: true,
                user: {
                  select: { name: true, companyName: true },
                },
              },
            },
            assignedWorker: {
              select: { id: true, name: true, employeeCode: true },
            },
          },
        },
        goodsMovements: {
          orderBy: { movementDate: "desc" },
          take: 50,
          include: {
            order: {
              select: { id: true, orderNumber: true },
            },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor/Partner not found." }, { status: 404 });
    }

    // Compute live metrics
    const totalAssignments = vendor.assignments.length;
    const activeAssignments = vendor.assignments.filter(
      (a) => a.status !== "COMPLETED" && a.status !== "CANCELLED"
    ).length;
    const totalQuantitySent = vendor.assignments.reduce(
      (sum, a) => sum + (a.quantitySent || 0),
      0
    );
    const totalQuantityReceived = vendor.assignments.reduce(
      (sum, a) => sum + (a.quantityReceived || 0),
      0
    );
    const pendingQuantity = Math.max(0, totalQuantitySent - totalQuantityReceived);

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        metrics: {
          totalAssignments,
          activeAssignments,
          totalQuantitySent,
          totalQuantityReceived,
          pendingQuantity,
        },
      },
    });
  } catch (error: any) {
    console.error("[OPS_GET_VENDOR_DETAIL_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch vendor details." }, { status: 500 });
  }
}

/**
 * PUT/PATCH /api/ops/vendors/[id]
 * Update partner information.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;
    const body = await req.json();

    const existing = await prisma.vendorPartner.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Vendor/Partner not found." }, { status: 404 });
    }

    const {
      name,
      code,
      partnerTypes,
      services,
      category,
      subcategory,
      products,
      location,
      contactPersons,
      phone,
      email,
      panNumber,
      gstNumber,
      isActive,
      sourceNotes,
      internalNotes,
    } = body;

    // Check code collision if code changed
    const trimmedCode = code !== undefined ? code?.trim() || null : existing.code;
    if (trimmedCode && trimmedCode !== existing.code) {
      const codeTaken = await prisma.vendorPartner.findUnique({
        where: { code: trimmedCode },
      });
      if (codeTaken) {
        return NextResponse.json(
          { error: `Code "${trimmedCode}" is already in use by ${codeTaken.name}.` },
          { status: 409 }
        );
      }
    }

    const normalizedLocation =
      location !== undefined
        ? location?.trim()
          ? location.trim().toUpperCase()
          : null
        : existing.normalizedLocation;

    const updated = await prisma.vendorPartner.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        code: trimmedCode,
        partnerTypes: partnerTypes !== undefined ? partnerTypes : existing.partnerTypes,
        services: services !== undefined ? services : existing.services,
        category: category !== undefined ? category?.trim() || null : existing.category,
        subcategory: subcategory !== undefined ? subcategory?.trim() || null : existing.subcategory,
        products: products !== undefined ? products?.trim() || null : existing.products,
        location: location !== undefined ? location?.trim() || null : existing.location,
        normalizedLocation,
        contactPersons: contactPersons !== undefined ? contactPersons?.trim() || null : existing.contactPersons,
        phone: phone !== undefined ? phone?.trim() || null : existing.phone,
        email: email !== undefined ? email?.trim() || null : existing.email,
        panNumber: panNumber !== undefined ? panNumber?.trim() || null : existing.panNumber,
        gstNumber: gstNumber !== undefined ? gstNumber?.trim() || null : existing.gstNumber,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        sourceNotes: sourceNotes !== undefined ? sourceNotes?.trim() || null : existing.sourceNotes,
        internalNotes: internalNotes !== undefined ? internalNotes?.trim() || null : existing.internalNotes,
        updatedBy: auth.context.employee.name,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: updated,
      message: `Partner "${updated.name}" updated successfully.`,
    });
  } catch (error: any) {
    console.error("[OPS_UPDATE_VENDOR_ERROR]", error);
    return NextResponse.json({ error: "Failed to update vendor/partner." }, { status: 500 });
  }
}

/**
 * DELETE /api/ops/vendors/[id]
 * Soft deactivate partner. Never permanently delete if referenced by an assignment.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = params;

    const vendor = await prisma.vendorPartner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true, goodsMovements: true },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor/Partner not found." }, { status: 404 });
    }

    // Always soft deactivate to preserve historical integrity
    const updated = await prisma.vendorPartner.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: auth.context.employee.name,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: updated,
      message: `Partner "${vendor.name}" deactivated. Historical transactions preserved.`,
    });
  } catch (error: any) {
    console.error("[OPS_DELETE_VENDOR_ERROR]", error);
    return NextResponse.json({ error: "Failed to deactivate vendor/partner." }, { status: 500 });
  }
}
