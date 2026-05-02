const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true }
  });
  
  const nextVal = (lastOrder?.orderNumber || 1000) + 1;
  console.log('Resetting sequence to start from:', nextVal);
  
  // For PostgreSQL
  await prisma.$executeRawUnsafe(`SELECT setval('order_ordernumber_seq', ${nextVal}, false)`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
