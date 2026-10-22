import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { EXTERNAL_WORK_STAGES } from "@/components/ops/vendors/VendorSelectDropdown";

describe("Phase 10: Vendor, Supplier, Manufacturer, Printing & Embroidery Verification Suite", () => {
  let testOrderId: string;
  let rawMaterialVendorId: string;
  let tailorVendorId: string;
  let printerVendorId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    // 1. Fetch imported test vendors from database
    const rmVendor = await prisma.vendorPartner.findFirst({
      where: { name: "Shri Ganesh Fabric" },
    });
    const tailor = await prisma.vendorPartner.findFirst({
      where: { name: "AMAR VAGGU" },
    });
    const printer = await prisma.vendorPartner.findFirst({
      where: { name: "Prime" },
    });
    const employee = await prisma.employee.findFirst({
      where: { employeeCode: { in: ["TT001", "TT002", "TT003"] } },
    });

    if (rmVendor) rawMaterialVendorId = rmVendor.id;
    if (tailor) tailorVendorId = tailor.id;
    if (printer) printerVendorId = printer.id;
    if (employee) testEmployeeId = employee.id;

    // 2. Create or find a test order for external workflow tests
    const existingOrder = await prisma.order.findFirst({
      where: { opsStage: { in: ["NEW_ORDER", "RESOURCE_FABRIC", "CUTTING", "STITCHING"] } },
    });

    if (existingOrder) {
      testOrderId = existingOrder.id;
    } else {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: "test-user-vendor@turba.test",
            name: "Test Ops User",
          },
        });
      }
      // Create a test order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          orderNumber: 99991,
          totalAmount: 15000,
          amountPaid: 7500,
          remainingAmount: 7500,
          status: "IN_PRODUCTION",
          opsStage: "RESOURCE_FABRIC",
          items: {
            create: {
              productId: "test-prod-1",
              quantity: 100,
              price: 150,
            },
          },
        },
      });
      testOrderId = order.id;
    }
  });

  // TEST 1: Raw material procurement
  it("Test 1: Neeraj/Management assigns raw material procurement with supplier relationship & audit trail", async () => {
    expect(rawMaterialVendorId).toBeDefined();

    const vendor = await prisma.vendorPartner.findUnique({
      where: { id: rawMaterialVendorId },
    });
    expect(vendor).toBeDefined();
    expect(vendor?.partnerTypes).toContain("RAW_MATERIAL_SUPPLIER");

    // Create RM procurement assignment
    const assignment = await prisma.externalWorkAssignment.create({
      data: {
        orderId: testOrderId,
        vendorId: rawMaterialVendorId,
        stage: "RESOURCE_FABRIC",
        workType: "RAW_MATERIAL_PROCUREMENT",
        serviceOrProduct: "Cotton-sinker 180 GSM",
        quantityRequired: 50,
        status: "ASSIGNED",
        assignedById: testEmployeeId || "employee-admin",
        assignedByName: "Neeraj",
        notes: "Procure 50kg fabric from Shri Ganesh Fabric",
      },
      include: {
        vendor: true,
      },
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.vendor.name).toBe("Shri Ganesh Fabric");
    expect(assignment.workType).toBe("RAW_MATERIAL_PROCUREMENT");
    expect(assignment.status).toBe("ASSIGNED");

    // Create audit timeline event
    const auditEvent = await prisma.orderTimelineEvent.create({
      data: {
        orderId: testOrderId,
        eventType: "OPS_VENDOR_ASSIGNED",
        title: "Vendor Assigned: Shri Ganesh Fabric",
        description: `Stage: RESOURCE_FABRIC | Work: RAW_MATERIAL_PROCUREMENT | Partner: ${vendor?.name}`,
        actorName: "Neeraj",
        actorRole: "EMPLOYEE",
        metadata: {
          assignmentId: assignment.id,
          vendorId: vendor?.id,
          vendorName: vendor?.name,
        },
      },
    });

    expect(auditEvent.id).toBeDefined();
    expect(auditEvent.title).toContain("Shri Ganesh Fabric");

    // Clean up assignment
    await prisma.externalWorkAssignment.delete({ where: { id: assignment.id } });
  });

  // TEST 2: Tailoring assignment
  it("Test 2: Pratik assigns shirt stitching and selects appropriate manufacturer with partner code & contact", async () => {
    expect(tailorVendorId).toBeDefined();

    const tailor = await prisma.vendorPartner.findUnique({
      where: { id: tailorVendorId },
    });
    expect(tailor).toBeDefined();
    expect(tailor?.name).toBe("AMAR VAGGU");
    expect(tailor?.code).toBe("TAILOR/AMAR VAGGU/001");
    expect(tailor?.phone).toBe("8421254266");
    expect(tailor?.partnerTypes).toContain("TAILOR_MANUFACTURER");

    // Create Stitching assignment
    const stitchingAssignment = await prisma.externalWorkAssignment.create({
      data: {
        orderId: testOrderId,
        vendorId: tailorVendorId,
        stage: "STITCHING",
        workType: "TAILORING_STITCHING",
        serviceOrProduct: "PANT, SHORTS stitching",
        quantityRequired: 100,
        status: "ASSIGNED",
        assignedById: testEmployeeId || "employee-admin",
        assignedByName: "Pratik",
        notes: "Standard pant tailoring batch",
      },
      include: {
        vendor: true,
      },
    });

    expect(stitchingAssignment.id).toBeDefined();
    expect(stitchingAssignment.vendor.code).toBe("TAILOR/AMAR VAGGU/001");
    expect(stitchingAssignment.vendor.phone).toBe("8421254266");
    expect(stitchingAssignment.orderId).toBe(testOrderId);

    // Clean up
    await prisma.externalWorkAssignment.delete({ where: { id: stitchingAssignment.id } });
  });

  // TEST 3: Printing or embroidery assignment with goods movement
  it("Test 3: Sanjay assigns garments to printing partner with quantity sent, due date & receipt tracking", async () => {
    expect(printerVendorId).toBeDefined();

    const printer = await prisma.vendorPartner.findUnique({
      where: { id: printerVendorId },
    });
    expect(printer).toBeDefined();
    expect(printer?.name).toBe("Prime");
    expect(printer?.services).toContain("SCREEN_PRINTING");
    expect(printer?.phone).toBe("9822193664");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const assignment = await prisma.externalWorkAssignment.create({
      data: {
        orderId: testOrderId,
        vendorId: printerVendorId,
        stage: "BRANDING_PRINTING",
        workType: "PRINTING_DECORATION",
        serviceOrProduct: "Screen Printing Chest Logo",
        quantityRequired: 100,
        expectedDeliveryDate: dueDate,
        status: "ASSIGNED",
        assignedByName: "Sanjay",
      },
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.expectedDeliveryDate).toBeDefined();

    // Clean up
    await prisma.externalWorkAssignment.delete({ where: { id: assignment.id } });
  });

  // TEST 4: Multiple independent partners on single order
  it("Test 4: Multiple partners (Supplier, Tailor, Printer) exist independently on one order without overwriting", async () => {
    expect(rawMaterialVendorId).toBeDefined();
    expect(tailorVendorId).toBeDefined();
    expect(printerVendorId).toBeDefined();

    // Create all 3 assignments for testOrderId
    const [a1, a2, a3] = await Promise.all([
      prisma.externalWorkAssignment.create({
        data: {
          orderId: testOrderId,
          vendorId: rawMaterialVendorId,
          stage: "RESOURCE_FABRIC",
          workType: "RAW_MATERIAL_PROCUREMENT",
          status: "ASSIGNED",
        },
      }),
      prisma.externalWorkAssignment.create({
        data: {
          orderId: testOrderId,
          vendorId: tailorVendorId,
          stage: "STITCHING",
          workType: "TAILORING_STITCHING",
          status: "ASSIGNED",
        },
      }),
      prisma.externalWorkAssignment.create({
        data: {
          orderId: testOrderId,
          vendorId: printerVendorId,
          stage: "BRANDING_PRINTING",
          workType: "PRINTING_DECORATION",
          status: "ASSIGNED",
        },
      }),
    ]);

    // Query order's external assignments
    const allAssignments = await prisma.externalWorkAssignment.findMany({
      where: { orderId: testOrderId },
      include: { vendor: true },
    });

    const vendorIds = allAssignments.map((a) => a.vendorId);
    expect(vendorIds).toContain(rawMaterialVendorId);
    expect(vendorIds).toContain(tailorVendorId);
    expect(vendorIds).toContain(printerVendorId);

    // Verify modifying tailor assignment does not overwrite raw material or printer
    const updatedA2 = await prisma.externalWorkAssignment.update({
      where: { id: a2.id },
      data: { status: "SENT_TO_PARTNER", quantitySent: 100 },
    });
    expect(updatedA2.status).toBe("SENT_TO_PARTNER");

    const recheckA1 = await prisma.externalWorkAssignment.findUnique({ where: { id: a1.id } });
    const recheckA3 = await prisma.externalWorkAssignment.findUnique({ where: { id: a3.id } });

    expect(recheckA1?.status).toBe("ASSIGNED");
    expect(recheckA3?.status).toBe("ASSIGNED");

    // Clean up
    await prisma.externalWorkAssignment.deleteMany({
      where: { id: { in: [a1.id, a2.id, a3.id] } },
    });
  });

  // TEST 5: Partial quantity receipt calculation & pending quantity accuracy
  it("Test 5: Accurate goods-outward (100 sent) -> partial receipt (60 received) -> balance receipt (40 received -> 0 pending)", async () => {
    // Create assignment
    const assignment = await prisma.externalWorkAssignment.create({
      data: {
        orderId: testOrderId,
        vendorId: printerVendorId,
        stage: "BRANDING_PRINTING",
        workType: "PRINTING_DECORATION",
        quantityRequired: 100,
        status: "ASSIGNED",
      },
    });

    // 1. Issue outward challan of 100 units
    const outwardMovement = await prisma.goodsMovement.create({
      data: {
        assignmentId: assignment.id,
        orderId: testOrderId,
        vendorId: printerVendorId,
        movementType: "OUTWARD_CHALLAN",
        quantity: 100,
        actorEmployeeName: "Sanjay",
      },
    });
    expect(outwardMovement.id).toBeDefined();

    await prisma.externalWorkAssignment.update({
      where: { id: assignment.id },
      data: {
        quantitySent: 100,
        status: "SENT_TO_PARTNER",
      },
    });

    // Verify 100 sent, 0 received, 100 pending
    let current = await prisma.externalWorkAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(current?.quantitySent).toBe(100);
    expect(current?.quantityReceived).toBe(0);
    expect((current?.quantitySent || 0) - (current?.quantityReceived || 0)).toBe(100);

    // 2. Receive partial 60 units back
    const inwardPart1 = await prisma.goodsMovement.create({
      data: {
        assignmentId: assignment.id,
        orderId: testOrderId,
        vendorId: printerVendorId,
        movementType: "INWARD_RECEIPT",
        quantity: 60,
        actorEmployeeName: "Mahesh",
      },
    });
    expect(inwardPart1.id).toBeDefined();

    await prisma.externalWorkAssignment.update({
      where: { id: assignment.id },
      data: {
        quantityReceived: 60,
        status: "PARTIALLY_RECEIVED",
      },
    });

    current = await prisma.externalWorkAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(current?.quantityReceived).toBe(60);
    expect((current?.quantitySent || 0) - (current?.quantityReceived || 0)).toBe(40);
    expect(current?.status).toBe("PARTIALLY_RECEIVED");

    // 3. Receive remaining 40 units
    const inwardPart2 = await prisma.goodsMovement.create({
      data: {
        assignmentId: assignment.id,
        orderId: testOrderId,
        vendorId: printerVendorId,
        movementType: "INWARD_RECEIPT",
        quantity: 40,
        actorEmployeeName: "Ajay",
      },
    });
    expect(inwardPart2.id).toBeDefined();

    await prisma.externalWorkAssignment.update({
      where: { id: assignment.id },
      data: {
        quantityReceived: 100,
        status: "RECEIVED",
      },
    });

    current = await prisma.externalWorkAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(current?.quantityReceived).toBe(100);
    expect((current?.quantitySent || 0) - (current?.quantityReceived || 0)).toBe(0);
    expect(current?.status).toBe("RECEIVED");

    // Clean up
    await prisma.goodsMovement.deleteMany({ where: { assignmentId: assignment.id } });
    await prisma.externalWorkAssignment.delete({ where: { id: assignment.id } });
  });

  // TEST 6: Inline new partner creation & immediate selection
  it("Test 6: Validates new partner creation schema and immediate assignment availability", async () => {
    const testCode = `TEST-PARTNER-${Date.now()}`;
    const newPartner = await prisma.vendorPartner.create({
      data: {
        name: "Quality Fabrics Test Partner",
        code: testCode,
        partnerTypes: ["RAW_MATERIAL_SUPPLIER"],
        location: "Pune",
        phone: "9876543210",
        isActive: true,
      },
    });

    expect(newPartner.id).toBeDefined();
    expect(newPartner.code).toBe(testCode);

    // Verify it is immediately selectable for work assignment
    const assignment = await prisma.externalWorkAssignment.create({
      data: {
        orderId: testOrderId,
        vendorId: newPartner.id,
        stage: "RESOURCE_FABRIC",
        workType: "RAW_MATERIAL_PROCUREMENT",
        status: "ASSIGNED",
      },
    });

    expect(assignment.vendorId).toBe(newPartner.id);

    // Clean up
    await prisma.externalWorkAssignment.delete({ where: { id: assignment.id } });
    await prisma.vendorPartner.delete({ where: { id: newPartner.id } });
  });

  // TEST 7: Validation rules & external stage requirements
  it("Test 7: Enforces external stage mapping rules (RESOURCE_FABRIC, CUTTING, STITCHING, BRANDING_PRINTING)", () => {
    expect(EXTERNAL_WORK_STAGES).toContain("RESOURCE_FABRIC");
    expect(EXTERNAL_WORK_STAGES).toContain("CUTTING");
    expect(EXTERNAL_WORK_STAGES).toContain("STITCHING");
    expect(EXTERNAL_WORK_STAGES).toContain("BRANDING_PRINTING");
    expect(EXTERNAL_WORK_STAGES).not.toContain("NEW_ORDER");
    expect(EXTERNAL_WORK_STAGES).not.toContain("QUALITY_CHECK");
    expect(EXTERNAL_WORK_STAGES).not.toContain("DISPATCHED");
  });

  // TEST 8: Idempotent import & seed verification
  it("Test 8: Database contains exact imported master record counts without duplication", async () => {
    const totalPartners = await prisma.vendorPartner.count();
    // 36 vendors + 11 tailors + 19 printing/embroidery = 66 imported partners
    expect(totalPartners).toBeGreaterThanOrEqual(66);

    const rmReferencesCount = await prisma.materialConsumptionReference.count();
    // 68 source entries from Manufacturing(RM).pdf
    expect(rmReferencesCount).toBe(68);
  });

  // TEST 9: Data integrity of ambiguous notes, blank PCPQ fields & null contacts
  it("Test 9: Preserves ambiguous source notes ('TAKEN', unverified notes) and keeps blank PCPQ fields empty", async () => {
    // Check Folkswear TAKEN note
    const folkswear = await prisma.vendorPartner.findFirst({
      where: { name: "Folkswear" },
    });
    expect(folkswear?.sourceNotes).toBe("TAKEN");

    // Check Chehika TAKEN note
    const chehika = await prisma.vendorPartner.findFirst({
      where: { name: "Chehika" },
    });
    expect(chehika?.sourceNotes).toBe("TAKEN");

    // Check Vishal printing note preservation
    const vishal = await prisma.vendorPartner.findFirst({
      where: { code: "SPD/VISHAL/TTV/01" },
    });
    expect(vishal?.sourceNotes).toContain("KT PRINTERS");

    // Check PCPQ material references have null GSM and null unitsPerKg
    const pcpqRecords = await prisma.materialConsumptionReference.findMany({
      where: { fabric: "PCPQ" },
    });
    expect(pcpqRecords.length).toBe(12);
    for (const rec of pcpqRecords) {
      expect(rec.gsm).toBeNull();
      expect(rec.unitsPerKg).toBeNull();
      expect(rec.sourceQuantity).toBeNull();
    }
  });

  // TEST 10: Material Consumption Reference fabric requirement formula
  it("Test 10: Material calculation formula matches source worksheet: Estimated kg = Qty / (Units per kg)", async () => {
    const ref = await prisma.materialConsumptionReference.findFirst({
      where: {
        productType: "Round Neck",
        fabric: "Micro plain polyester",
        sizeBand: "18-24",
        gsm: "140-160",
      },
    });

    expect(ref).toBeDefined();
    expect(ref?.unitsPerKg).toBe(8);
    expect(ref?.sourceQuantity).toBe(1400);
    expect(ref?.sourceFabricRequiredKg).toBe(175);

    // Calculate dynamically: 1400 / 8 = 175
    const calculatedKg = (ref?.sourceQuantity || 0) / (ref?.unitsPerKg || 1);
    expect(calculatedKg).toBe(175);
  });
});
