import { NextRequest, NextResponse } from "next/server";
import { requireOpsAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/rm-reference
 * Query material planning & consumption reference table or compute fabric requirements.
 */
export async function GET(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get("productType")?.trim();
    const fabric = searchParams.get("fabric")?.trim();
    const sizeBand = searchParams.get("sizeBand")?.trim();
    const gsm = searchParams.get("gsm")?.trim();
    const quantityParam = searchParams.get("quantity");

    const where: any = {};
    if (productType && productType !== "ALL") where.productType = productType;
    if (fabric && fabric !== "ALL") where.fabric = fabric;
    if (sizeBand && sizeBand !== "ALL") where.sizeBand = sizeBand;
    if (gsm && gsm !== "ALL") where.gsm = gsm;

    const records = await prisma.materialConsumptionReference.findMany({
      where,
      orderBy: [
        { productType: "asc" },
        { fabric: "asc" },
        { sizeBand: "asc" },
      ],
    });

    // Provide distinct filter options
    const [allProductTypes, allFabrics, allSizeBands] = await Promise.all([
      prisma.materialConsumptionReference.findMany({
        select: { productType: true },
        distinct: ["productType"],
      }),
      prisma.materialConsumptionReference.findMany({
        select: { fabric: true },
        distinct: ["fabric"],
      }),
      prisma.materialConsumptionReference.findMany({
        select: { sizeBand: true },
        distinct: ["sizeBand"],
      }),
    ]);

    // If calculation requested
    let calculationResult: any = null;
    if (quantityParam) {
      const qty = parseInt(quantityParam, 10);
      if (!isNaN(qty) && qty > 0 && records.length > 0) {
        // Find best match with valid unitsPerKg
        const validMatch = records.find(
          (r) => r.unitsPerKg !== null && r.unitsPerKg > 0
        );

        if (validMatch && validMatch.unitsPerKg) {
          const estimatedKg = qty / validMatch.unitsPerKg;
          calculationResult = {
            inputQuantity: qty,
            productType: validMatch.productType,
            fabric: validMatch.fabric,
            sizeBand: validMatch.sizeBand,
            gsm: validMatch.gsm,
            unitsPerKg: validMatch.unitsPerKg,
            estimatedFabricRequiredKg: Number(estimatedKg.toFixed(3)),
            formula: `${qty} units / ${validMatch.unitsPerKg} units/kg = ${estimatedKg.toFixed(3)} kg`,
            sourceComparison: validMatch.sourceFabricRequiredKg
              ? `Source reference: ${validMatch.sourceQuantity} units = ${validMatch.sourceFabricRequiredKg} kg`
              : null,
            supplierBrandNote: validMatch.supplierBrandNote || null,
          };
        } else {
          calculationResult = {
            inputQuantity: qty,
            error: "Selected specification does not have a positive units/kg metric defined in reference data.",
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      records,
      totalCount: records.length,
      filterOptions: {
        productTypes: allProductTypes.map((p) => p.productType),
        fabrics: allFabrics.map((f) => f.fabric),
        sizeBands: allSizeBands.map((s) => s.sizeBand),
      },
      calculation: calculationResult,
    });
  } catch (error: any) {
    console.error("[OPS_GET_RM_REFERENCE_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch material reference data." }, { status: 500 });
  }
}
