import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendorPartner.findMany({
    orderBy: { name: "asc" },
  });
  console.log(`Total vendors: ${vendors.length}`);
  for (const v of vendors) {
    console.log(`${v.name.padEnd(30)} | types: [${v.partnerTypes.join(", ")}] | cat: ${v.category} | subcat: ${v.subcategory} | services: [${v.services.join(", ")}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
