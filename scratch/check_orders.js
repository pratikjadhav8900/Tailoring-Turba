const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.orderItem.findMany({
    take: 5,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      productId: true,
      mockupUrl: true,
      printFiles: true,
      customStateJson: true
    }
  });
  console.log(JSON.stringify(items, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
