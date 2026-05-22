import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.product.count();
  console.log("Total Products:", count);
  const firstProd = await prisma.product.findFirst();
  console.log("First Product ID:", firstProd?.id);
}
main().finally(() => prisma.$disconnect());
