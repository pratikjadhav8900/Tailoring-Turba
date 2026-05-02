const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count();
  console.log('Order count:', count);
  const allOrders = await prisma.order.findMany({
    select: { id: true, orderNumber: true },
    take: 10
  });
  console.log('Orders:', allOrders);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
