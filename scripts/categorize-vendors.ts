import { PrismaClient, PartnerType, PartnerService } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Categorizing external vendors in the database...");

  // 1. Raw material & procurement suppliers that had missing partnerTypes
  const procurementSuppliers: Record<string, { category: string; subcategory?: string; products?: string; partnerTypes: PartnerType[]; services: PartnerService[] }> = {
    "Aspitek Solutions": {
      category: "Raw Material",
      subcategory: "Fabric & Sourcing",
      products: "Fabrics & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "BOB FAB": {
      category: "Raw Material",
      subcategory: "Fabric Supply",
      products: "Fabrics",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Vishal Sales Corporation": {
      category: "Raw Material",
      subcategory: "Fabric & Sourcing",
      products: "Fabrics & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Vimal International": {
      category: "Raw Material",
      subcategory: "Fabric & Textiles",
      products: "Fabrics",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Sparsh FAB Textiles P Ltd": {
      category: "Raw Material",
      subcategory: "Fabric & Textiles",
      products: "Fabrics",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Rishabh Entersprises": {
      category: "Raw Material",
      subcategory: "Fabric & Sourcing",
      products: "Fabrics & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Magic Yarn": {
      category: "Raw Material",
      subcategory: "Yarn",
      products: "Yarns & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Kothari Uniforms Pvt Ltd": {
      category: "Finished Goods",
      subcategory: "Uniforms",
      products: "Uniforms & Blank Wear",
      partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
      services: [PartnerService.FINISHED_GOODS_SUPPLY],
    },
    "Dewani Impex": {
      category: "Raw Material",
      subcategory: "Fabric Supply",
      products: "Fabrics",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Diva Label": {
      category: "Raw Material",
      subcategory: "Labels & Trims",
      products: "Labels, Tags & Trims",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Prakash & Co": {
      category: "Raw Material",
      subcategory: "Fabric & Sourcing",
      products: "Fabrics & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Shriyan TextFab": {
      category: "Raw Material",
      subcategory: "Fabric & Textiles",
      products: "Fabrics",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "Magcool LLP": {
      category: "Raw Material",
      subcategory: "Fabric & Sourcing",
      products: "Fabrics & Raw Materials",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
    "G C YRans": {
      category: "Raw Material",
      subcategory: "Yarn",
      products: "Yarns",
      partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
      services: [PartnerService.FABRIC_SUPPLY],
    },
  };

  for (const [name, data] of Object.entries(procurementSuppliers)) {
    const updated = await prisma.vendorPartner.updateMany({
      where: { name: { equals: name, mode: "insensitive" } },
      data: {
        partnerTypes: data.partnerTypes,
        services: data.services,
        category: data.category,
        subcategory: data.subcategory || null,
        products: data.products || null,
      },
    });
    console.log(`Updated Procurement supplier ${name}: ${updated.count} record(s)`);
  }

  // 2. Printing & Embroidery partners with missing category/services
  const printingPartners: Record<string, { category: string; subcategory?: string; products?: string; services: PartnerService[] }> = {
    "Shakti Printing Hub": {
      category: "Printing & Decoration",
      products: "Screen Print & DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Akash": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Sandeep": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Sachin": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Tushar": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Arvind Chillal": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Sheru": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Rohan": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Abbas": {
      category: "Printing & Decoration",
      products: "Screen Print, DTF",
      services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    },
    "Zubair": {
      category: "Embroidery",
      products: "Custom Embroidery",
      services: [PartnerService.EMBROIDERY],
    },
  };

  for (const [name, data] of Object.entries(printingPartners)) {
    const updated = await prisma.vendorPartner.updateMany({
      where: { name: { equals: name, mode: "insensitive" } },
      data: {
        partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
        services: data.services,
        category: data.category,
        products: data.products,
      },
    });
    console.log(`Updated Print/Emb partner ${name}: ${updated.count} record(s)`);
  }

  // Summary counts
  const all = await prisma.vendorPartner.findMany();
  const procurementCount = all.filter((v) =>
    v.partnerTypes.includes(PartnerType.RAW_MATERIAL_SUPPLIER) ||
    v.partnerTypes.includes(PartnerType.FINISHED_GOODS_SUPPLIER)
  ).length;
  const printEmbCount = all.filter((v) =>
    v.partnerTypes.includes(PartnerType.PRINTING_EMBROIDERY_PARTNER)
  ).length;
  const tailorCount = all.filter((v) =>
    v.partnerTypes.includes(PartnerType.TAILOR_MANUFACTURER)
  ).length;
  const uncategorizedCount = all.filter((v) => v.partnerTypes.length === 0).length;

  console.log("\n=== FINAL RE-CATEGORIZATION SUMMARY ===");
  console.log(`Total vendors: ${all.length}`);
  console.log(`Procurement vendors: ${procurementCount}`);
  console.log(`Printing & Embroidery vendors: ${printEmbCount}`);
  console.log(`Tailors / Manufacturers: ${tailorCount}`);
  console.log(`Uncategorized: ${uncategorizedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
