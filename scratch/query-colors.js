const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const p = await prisma.product.findUnique({ where: { id: 'cmojuujrw003b5fp3trjmddgr' } }); 
  console.log(p.colors); 
} 
main().finally(() => prisma.$disconnect());
