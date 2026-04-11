import { PrismaClient } from '@prisma/client';
import { CATALOGUE_CATEGORIES } from '../../src/lib/catalogue-data';

const prisma = new PrismaClient();

export async function seedCatalogue() {
  console.log('Seeding Master Corporate Gifts Catalogue 2026-2027...');

  // Reset existing catalogue data
  await prisma.catalogueProduct.deleteMany({});
  await prisma.catalogueCategory.deleteMany({});

  for (const catData of (CATALOGUE_CATEGORIES as any[])) {
    const category = await prisma.catalogueCategory.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        hsn: catData.hsn || null,
        gst: catData.gst || null,
        pages: catData.pages || [],
      },
    });

    if (catData.products && catData.products.length > 0) {
      const productData = catData.products.map((p: any) => ({
        categoryId: category.id,
        code: p.code,
        name: p.name,
        spec: (p as any).spec || null,
        hsn: p.hsn || null,
        gst: p.gst || null,
        minOrderQuantity: 50,
        isB2B: true,
      }));

      await prisma.catalogueProduct.createMany({
        data: productData,
      });
    }
  }

  console.log('Catalogue seeding completed successfully.');
}
