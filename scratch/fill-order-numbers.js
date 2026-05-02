const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { orderNumber: null },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${orders.length} orders with null orderNumber`);
  
  let currentMax = 1000;
  const lastOrder = await prisma.order.findFirst({
    where: { NOT: { orderNumber: null } },
    orderBy: { orderNumber: 'desc' }
  });
  
  if (lastOrder && lastOrder.orderNumber) {
    currentMax = lastOrder.orderNumber;
  }
  
  for (const order of orders) {
    currentMax++;
    await prisma.order.update({
      where: { id: order.id },
      data: { orderNumber: currentMax }
    });
    console.log(`Updated order ${order.id} to orderNumber ${currentMax}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
