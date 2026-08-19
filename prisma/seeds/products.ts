import { PrismaClient } from '@prisma/client';
import { allProducts } from '../../src/lib/products-data';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('Checking database product records...');

  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`Database already contains ${existingCount} products. Skipping seeding to preserve live data.`);
    return;
  }

  console.log('Database is empty. Seeding initial products and categories...');

  // 1. Extract unique categories
  const categoryNames = Array.from(new Set(allProducts.map(p => p.category)));

  // 2. Create or update categories in the database and map name -> id
  const categoryMap: Record<string, string> = {};
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const cat = await prisma.category.upsert({
      where: { name },
      update: { slug },
      create: {
        name,
        slug,
        image: ""
      }
    });
    categoryMap[name] = cat.id;
  }

  // 3. Update or create all products linked to their category
  for (const p of allProducts) {
    const images = p.gallery && p.gallery.length > 0 ? p.gallery : [p.image];
    const baseSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if product already exists by name or by ID
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { name: p.name },
          { id: String(p.id) }
        ]
      }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description || `${p.name} - premium customizable corporate wear.`,
          basePrice: p.price || 199,
          minOrderQuantity: p.minOrderQuantity || 10,
          categoryId: categoryMap[p.category] || existing.categoryId,
          images: images,
          badge: p.badge || null,
          colors: p.colors || 0,
          features: p.features || [],
          type: p.type || null,
          brand: p.brand || "TAILORING TURBA",
          isActive: true
        }
      });
    } else {
      let slug = baseSlug;
      let counter = 2;
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await prisma.product.create({
        data: {
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
          isActive: true,
          slug: slug,
          seoTitle: `${p.name} | Custom ${p.category} | TAILORING TURBA`,
          seoDescription: `Shop custom ${p.name} at Tailoring Turba. Premium customizable corporate wear.`,
          seoKeywords: `${p.name.toLowerCase()}, custom ${p.name.toLowerCase()}, ${p.category.toLowerCase()}, tailoring turba`
        }
      });
    }
  }

  console.log('Products and Categories seeding completed successfully.');
}
