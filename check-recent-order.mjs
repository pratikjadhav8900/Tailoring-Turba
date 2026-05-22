import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const recent = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 2, include: { user: true } });
  console.log(JSON.stringify(recent, null, 2));
}
main().finally(() => prisma.$disconnect());
