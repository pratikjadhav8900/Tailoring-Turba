import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.product.count();
  console.log("Total Products:", count);
  const custProd = await prisma.product.findFirst({ where: { category: "customizer" } });
  console.log("Customizer Product:", custProd);
}
main().finally(() => prisma.$disconnect());
