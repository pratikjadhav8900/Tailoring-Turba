import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SourceRMInput {
  productType: string;
  sizeBand: string;
  fabric: string;
  gsm?: string | null;
  unitKg?: number | null;
  unitsPerKg?: number | null;
  sourceQuantity?: number | null;
  sourceFabricRequiredKg?: number | null;
  supplierBrandNote?: string | null;
  notes?: string | null;
}

export const RAW_RM_REFERENCE_DATA: SourceRMInput[] = [
  // 1. Round Neck — Cotton-sinker (8 rows)
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Cotton-sinker', gsm: '160-180', unitKg: 1, unitsPerKg: 7.5, sourceQuantity: 60, sourceFabricRequiredKg: 8 },
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Cotton-sinker', gsm: '200-220', unitKg: 1, unitsPerKg: 6, sourceQuantity: 0, sourceFabricRequiredKg: 0 },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Cotton-sinker', gsm: '160-180', unitKg: 1, unitsPerKg: 6.5, sourceQuantity: 12, sourceFabricRequiredKg: 1.846153846 },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Cotton-sinker', gsm: '200-220', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 0, sourceFabricRequiredKg: 0 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Cotton-sinker', gsm: '160-180', unitKg: 1, unitsPerKg: 5, sourceQuantity: 0, sourceFabricRequiredKg: 0 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Cotton-sinker', gsm: '200-220', unitKg: 1, unitsPerKg: 4, sourceQuantity: 0, sourceFabricRequiredKg: 0 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Cotton-sinker', gsm: '160-180', unitKg: 1, unitsPerKg: 3, sourceQuantity: 0, sourceFabricRequiredKg: 0 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Cotton-sinker', gsm: '200-220', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 0, sourceFabricRequiredKg: 0 },

  // 2. Round Neck — Micro plain polyester (8 rows)
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 8, sourceQuantity: 1400, sourceFabricRequiredKg: 175 },
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 7, sourceQuantity: 50, sourceFabricRequiredKg: 7.142857143 },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 7, sourceQuantity: 30, sourceFabricRequiredKg: 4.285714286 },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 20, sourceFabricRequiredKg: 3.636363636 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 5, sourceQuantity: 20, sourceFabricRequiredKg: 4 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 4.5, sourceQuantity: 25, sourceFabricRequiredKg: 5.555555556 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 3.5, sourceQuantity: 30, sourceFabricRequiredKg: 8.571428571 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 40, sourceFabricRequiredKg: 16 },

  // 2b. Collar — Micro plain polyester (8 rows)
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 8, sourceQuantity: 1400, sourceFabricRequiredKg: 175 },
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 7, sourceQuantity: 50, sourceFabricRequiredKg: 7.142857143 },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 7, sourceQuantity: 30, sourceFabricRequiredKg: 4.285714286 },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 20, sourceFabricRequiredKg: 3.636363636 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 5, sourceQuantity: 20, sourceFabricRequiredKg: 4 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 4.5, sourceQuantity: 25, sourceFabricRequiredKg: 5.555555556 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Micro plain polyester', gsm: '140-160', unitKg: 1, unitsPerKg: 3.5, sourceQuantity: 30, sourceFabricRequiredKg: 8.571428571 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Micro plain polyester', gsm: '180-190', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 40, sourceFabricRequiredKg: 16 },

  // 3. Round Neck — Dry Fit (8 rows)
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 8, sourceQuantity: 10, sourceFabricRequiredKg: 1.25, supplierBrandNote: 'nirmal knit' },
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 7, sourceQuantity: 50, sourceFabricRequiredKg: 7.142857143, supplierBrandNote: 'rise knit' },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 7, sourceQuantity: 30, sourceFabricRequiredKg: 4.285714286, supplierBrandNote: 'dot knit' },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 20, sourceFabricRequiredKg: 3.636363636 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 5, sourceQuantity: 20, sourceFabricRequiredKg: 4 },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 4.5, sourceQuantity: 25, sourceFabricRequiredKg: 5.555555556 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 3.5, sourceQuantity: 30, sourceFabricRequiredKg: 8.571428571 },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 40, sourceFabricRequiredKg: 16 },

  // 4. Collar — Dry Fit (8 rows)
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 8, sourceQuantity: 1400, sourceFabricRequiredKg: 175, supplierBrandNote: 'nirmal knit' },
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 7, sourceQuantity: 50, sourceFabricRequiredKg: 7.142857143, supplierBrandNote: 'rise knit' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 7, sourceQuantity: 30, sourceFabricRequiredKg: 4.285714286, supplierBrandNote: 'dot knit' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 20, sourceFabricRequiredKg: 3.636363636 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 5, sourceQuantity: 20, sourceFabricRequiredKg: 4 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 4.5, sourceQuantity: 25, sourceFabricRequiredKg: 5.555555556 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Dry Fit', gsm: '140-160', unitKg: 1, unitsPerKg: 3.5, sourceQuantity: 30, sourceFabricRequiredKg: 8.571428571 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Dry Fit', gsm: '180-190', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 40, sourceFabricRequiredKg: 16 },

  // 5. Round Neck — Ad Dry Fit (4 rows)
  { productType: 'Round Neck', sizeBand: '18-24', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 6, sourceQuantity: 1400, sourceFabricRequiredKg: 233.3333333, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Round Neck', sizeBand: '26-32', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 6, sourceQuantity: 50, sourceFabricRequiredKg: 8.333333333, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Round Neck', sizeBand: '34-42', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 4, sourceQuantity: 30, sourceFabricRequiredKg: 7.5, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Round Neck', sizeBand: '44-50', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 2.75, sourceQuantity: 20, sourceFabricRequiredKg: 7.272727273, supplierBrandNote: '(Dull Dry fit)/PUK' },

  // 5b. Collar — Ad Dry Fit (4 rows)
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 6, sourceQuantity: 1400, sourceFabricRequiredKg: 233.3333333, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 6, sourceQuantity: 50, sourceFabricRequiredKg: 8.333333333, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 4, sourceQuantity: 30, sourceFabricRequiredKg: 7.5, supplierBrandNote: '(Dull Dry fit)/PUK' },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Ad Dry Fit', gsm: '220', unitKg: 1, unitsPerKg: 2.75, sourceQuantity: 20, sourceFabricRequiredKg: 7.272727273, supplierBrandNote: '(Dull Dry fit)/PUK' },

  // 6. Collar — Spun Matty (8 rows)
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Spun Matty', gsm: '190', unitKg: 1, unitsPerKg: 8, sourceQuantity: 1400, sourceFabricRequiredKg: 175, supplierBrandNote: 'nirmal knit' },
  { productType: 'Collar', sizeBand: '18-24', fabric: 'Spun Matty', gsm: '200', unitKg: 1, unitsPerKg: 7, sourceQuantity: 50, sourceFabricRequiredKg: 7.142857143, supplierBrandNote: 'rise knit' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Spun Matty', gsm: '190', unitKg: 1, unitsPerKg: 7, sourceQuantity: 30, sourceFabricRequiredKg: 4.285714286, supplierBrandNote: 'dot knit' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'Spun Matty', gsm: '200', unitKg: 1, unitsPerKg: 5.5, sourceQuantity: 20, sourceFabricRequiredKg: 3.636363636 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Spun Matty', gsm: '190', unitKg: 1, unitsPerKg: 5, sourceQuantity: 20, sourceFabricRequiredKg: 4 },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'Spun Matty', gsm: '200', unitKg: 1, unitsPerKg: 4.5, sourceQuantity: 180, sourceFabricRequiredKg: 40 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Spun Matty', gsm: '190', unitKg: 1, unitsPerKg: 3.5, sourceQuantity: 30, sourceFabricRequiredKg: 8.571428571 },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'Spun Matty', gsm: '200', unitKg: 1, unitsPerKg: 2.5, sourceQuantity: 40, sourceFabricRequiredKg: 16 },

  // 7. Collar — PCPQ (12 rows with unspecified fields left blank)
  { productType: 'Collar', sizeBand: '18-24', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 1)' },
  { productType: 'Collar', sizeBand: '18-24', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 2)' },
  { productType: 'Collar', sizeBand: '18-24', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 3)' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 1)' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 2)' },
  { productType: 'Collar', sizeBand: '26-32', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 3)' },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 1)' },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 2)' },
  { productType: 'Collar', sizeBand: '34-42', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 3)' },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 1)' },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 2)' },
  { productType: 'Collar', sizeBand: '44-50', fabric: 'PCPQ', notes: 'Source fields unspecified (Row 3)' },
];

export async function seedRMReference() {
  console.log('Synchronizing Material Planning / Consumption Reference from Manufacturing(RM).pdf...');

  // Idempotent approach: Delete existing imported records from Manufacturing(RM).pdf and re-insert cleanly
  await prisma.materialConsumptionReference.deleteMany({
    where: { sourceDocument: 'Manufacturing(RM).pdf' },
  });

  const created = await prisma.materialConsumptionReference.createMany({
    data: RAW_RM_REFERENCE_DATA.map((item) => ({
      productType: item.productType,
      sizeBand: item.sizeBand,
      fabric: item.fabric,
      gsm: item.gsm || null,
      unitKg: item.unitKg || null,
      unitsPerKg: item.unitsPerKg || null,
      sourceQuantity: item.sourceQuantity !== undefined ? item.sourceQuantity : null,
      sourceFabricRequiredKg: item.sourceFabricRequiredKg !== undefined ? item.sourceFabricRequiredKg : null,
      supplierBrandNote: item.supplierBrandNote || null,
      sourceDocument: 'Manufacturing(RM).pdf',
      notes: item.notes || null,
    })),
  });

  console.log(`[SEED RM REFERENCE] Inserted ${created.count} consumption reference records.`);
}
