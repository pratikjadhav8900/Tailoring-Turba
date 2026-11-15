import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.vendorPartner.findMany({
    orderBy: { name: "asc" },
  });
  console.log(`=== ALL ${vendors.length} VENDORS IN DATABASE ===\n`);
  vendors.forEach((v, i) => {
    console.log(
      `#${i + 1} [${v.id}] ${v.name}` +
      `\n  Code: ${v.code || "NONE"}` +
      `\n  Types: [${v.partnerTypes.join(", ")}]` +
      `\n  Category: ${v.category || "NONE"} | Subcategory: ${v.subcategory || "NONE"}` +
      `\n  Products: ${v.products || "NONE"}` +
      `\n  Services: [${v.services.join(", ")}]` +
      `\n  Location: ${v.location || "NONE"}` +
      `\n  SourceNotes: ${v.sourceNotes || "NONE"}\n`
    );
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
