const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT relname FROM pg_class WHERE relkind = 'S'`);
  console.log('Sequences:', result);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
