import { PrismaClient } from '@prisma/client';
import { allProducts } from '../lib/products-data';

const prisma = new PrismaClient();

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Start seeding...');

  // Get unique categories from allProducts
  const categories = Array.from(new Set(allProducts.map(p => p.category)));
  
  const categoryMap: Record<string, string> = {};

  for (const catName of categories) {
    const slug = generateSlug(catName);
    
    // Upsert Category
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        slug: slug,
      },
    });
    
    categoryMap[catName] = category.id;
    console.log(`Ensured category exists: ${catName}`);
  }

  // Insert all products
  for (const p of allProducts) {
    const categoryId = categoryMap[p.category];
    
    if (!categoryId) continue;

    // We parse the numeric price from string "₹115"
    const priceMatch = p.price.match(/\d+/);
    const numericPrice = priceMatch ? parseInt(priceMatch[0], 10) : 0;

    const newProduct = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description || '',
        basePrice: numericPrice,
        minOrderQuantity: 1, // Defaulting to 1 for retail display
        categoryId: categoryId,
        images: [p.image], // Wrapping the single image in an array
        type: p.type,
        badge: p.badge,
        colors: p.colors || null,
        features: p.features || [],
      },
    });
    
    console.log(`Created product: ${newProduct.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
