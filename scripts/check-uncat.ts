import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const uncat = await prisma.vendorPartner.findMany({
    where: {
      partnerTypes: { isEmpty: true },
    },
  });
  console.log(`Found ${uncat.length} vendors with empty partnerTypes:`);
  for (const v of uncat) {
    console.log(JSON.stringify(v, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
