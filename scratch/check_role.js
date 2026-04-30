const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'vighnesh@gmail.com' },
    select: { id: true, email: true, role: true }
  });
  console.log('USER_INFO:', JSON.stringify(user));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
