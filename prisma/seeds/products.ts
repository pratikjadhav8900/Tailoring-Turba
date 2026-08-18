import { PrismaClient } from '@prisma/client';
import { allProducts } from '../../src/lib/products-data';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('Seeding Master Products and Categories...');

  // Reset existing product-related data
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Extract unique categories
  const categoryNames = Array.from(new Set(allProducts.map(p => p.category)));

  // 2. Create categories in the database and map name -> id
  const categoryMap: Record<string, string> = {};
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cat = await prisma.category.create({
      data: {
        name,
        slug,
        image: "" // Category image can be loaded dynamically
      }
    });
    categoryMap[name] = cat.id;
  }

  // 3. Seed all products linked to their category
  for (const p of allProducts) {
    const images = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];
    await prisma.product.create({
      data: {
        id: String(p.id),
        name: p.name,
        description: p.description || `${p.name} - premium customizable corporate wear.`,
        basePrice: p.price || 199,
        minOrderQuantity: p.minOrderQuantity || 10,
        categoryId: categoryMap[p.category] || "",
        images: images,
        badge: p.badge || null,
        colors: p.colors || 0,
        features: p.features || [],
        type: p.type || null,
        brand: p.brand || "TAILORING TURBA",
        isActive: true
      }
    });
  }

  console.log('Products and Categories seeding completed successfully.');
}
