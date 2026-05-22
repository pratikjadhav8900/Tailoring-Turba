const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category.name,
    type: p.type
  })), null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
