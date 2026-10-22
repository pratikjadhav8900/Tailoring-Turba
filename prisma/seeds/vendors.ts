import { PrismaClient, PartnerType, PartnerService } from '@prisma/client';

const prisma = new PrismaClient();

export interface SourceVendorInput {
  name: string;
  code?: string;
  partnerTypes: PartnerType[];
  services: PartnerService[];
  category?: string;
  subcategory?: string;
  products?: string;
  location?: string;
  contactPersons?: string;
  phone?: string;
  email?: string;
  panNumber?: string;
  gstNumber?: string;
  sourceNotes?: string;
  internalNotes?: string;
}

// 36 Vendors from "Manufaturing Dash Board (TT) - Vendor Detail.pdf"
export const RAW_VENDOR_DETAIL_DATA: SourceVendorInput[] = [
  {
    name: 'KB Corp',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER, PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY, PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Raw Material + Finished Goods',
  },
  {
    name: 'Dazzle Export',
    location: 'Pune',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'Folkswear',
    location: 'Pune',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
    sourceNotes: 'TAKEN',
  },
  {
    name: 'Chehika',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER, PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY, PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Raw Material + Finished Goods',
    sourceNotes: 'TAKEN',
  },
  {
    name: 'Shri Ganesh Fabric',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'House of Fabric',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'VR clothing',
    location: 'Tirupur',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'Renuka Fabric',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Shirting + Suiting',
    products: 'Shirting + Suiting',
  },
  {
    name: 'Sonigara Garments',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Shirting + Suiting',
    products: 'Shirting + Suiting',
  },
  {
    name: 'Anshu Clothing',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Shirting + Suiting',
    products: 'Shirting + Suiting',
  },
  {
    name: 'Manish Textile',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Shirting + Suiting',
    products: 'Shirting + Suiting',
  },
  {
    name: 'Shah babulal',
    location: 'Pune',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Suiting',
    products: 'Suiting',
  },
  {
    name: 'The Tenth House',
    location: 'Mumbai',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'BlissWear',
    location: 'Ahmedabad',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'Fleming Fabtex',
    location: 'Ahmedabad',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'Mittal Traders',
    location: 'Delhi',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'Gopaljee Fabrics',
    location: 'Delhi',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'Own Knitted Blank Wear',
    location: 'Delhi',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'Reliable Fabrics',
    location: 'Ludhiana',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Hosiery',
    products: 'Hosiery',
  },
  {
    name: 'Rj Garments',
    location: 'Tirupur',
    partnerTypes: [PartnerType.RAW_MATERIAL_SUPPLIER],
    services: [PartnerService.FABRIC_SUPPLY],
    category: 'Raw Material',
    subcategory: 'Shirting + Suiting',
    products: 'Tshirts',
  },
  {
    name: 'ALL BLANK SHIRTS',
    location: 'PUNE',
    partnerTypes: [PartnerType.FINISHED_GOODS_SUPPLIER],
    services: [PartnerService.FINISHED_GOODS_SUPPLY],
    category: 'Finished Goods',
  },
  {
    name: 'Aspitek Solutions',
    location: 'PUNE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'BOB FAB',
    location: 'Kolkata',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Vishal Sales Corporation',
    location: 'PUNE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Vimal International',
    location: 'GUJARAT',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Sparsh FAB Textiles P Ltd',
    location: 'Mumbai',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Shakti Printing Hub',
    location: 'PUNE',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Category not specified in this vendor list (Printing Partner by name)',
  },
  {
    name: 'Rishabh Entersprises',
    location: 'THANE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Magic Yarn',
    location: 'PUNE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Kothari Uniforms Pvt Ltd',
    location: 'GUJARAT',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Dewani Impex',
    location: 'Mumbai',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Diva Label',
    location: 'GUJARAT',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Prakash & Co',
    location: 'PUNE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Shriyan TextFab',
    location: 'GUJARAT',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'Magcool LLP',
    location: 'PUNE',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
  {
    name: 'G C YRans',
    location: 'Ludhiana',
    partnerTypes: [],
    services: [],
    sourceNotes: 'Category not specified in source document',
  },
];

// 11 Tailors/Manufacturers from "Manufaturing Dash Board (TT) - Tailors Detail.pdf"
export const RAW_TAILORS_DETAIL_DATA: SourceVendorInput[] = [
  {
    name: 'AMAR VAGGU',
    code: 'TAILOR/AMAR VAGGU/001',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'PANT, SHORTS',
    phone: '8421254266',
    sourceNotes: 'created group',
  },
  {
    name: 'GANESH JADHAV',
    code: 'TAILOR/GANESH JADHAV/ 002',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'PANT',
    phone: '8208556163',
  },
  {
    name: 'JAFAR',
    code: 'TAILOR/JAFAR/ 003',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRT/ APRONS/ KIDS SHORTS',
    phone: '8888218785',
    sourceNotes: 'created group',
  },
  {
    name: 'KHALIL',
    code: 'TAILOR/KHALIL/ 004',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRT',
    phone: '9064842707',
  },
  {
    name: 'MEHBOOB MOMIN',
    code: 'TAILOR/MEHBOOB M/ 006',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRT / PANT / SAFARI',
    phone: '9921999175',
    sourceNotes: 'created not called',
  },
  {
    name: 'SHRINIVAS',
    code: 'TAILOR/SHRINIVAS/010',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRT/ APRONS/ CHEF COATS',
    phone: '8625083880',
  },
  {
    name: 'SHAHAD Ansari',
    code: 'TAILOR/SHAHAD ANSARI/011',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRTS',
    phone: '8983537098',
  },
  {
    name: 'SK HAFIZEL',
    code: 'TAILOR/S K HAFIZEL/012',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRTS',
    phone: '9518990903',
  },
  {
    name: 'Halil Ansari',
    code: 'TAILOR/HALIL ANSARI/013',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRTS',
    phone: '6393529361',
    sourceNotes: 'created group',
  },
  {
    name: 'Lala Shinde',
    code: 'TAILOR/LALA SHINDE /014',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'SHIRTS',
    phone: '9730581196',
  },
  {
    name: 'ANAND GINDE',
    code: 'TAILOR/ANAND GINDE /018',
    partnerTypes: [PartnerType.TAILOR_MANUFACTURER],
    services: [PartnerService.STITCHING],
    category: 'Tailor / Manufacturer',
    products: 'ONLY STCHING SHIRTS',
    phone: '9860255657',
  },
];

// 19 Printing & Embroidery Partners from "Manufaturing Dash Board (TT) - Printjng &Embroidery Patners .pdf"
export const RAW_PRINTING_EMBROIDERY_DATA: SourceVendorInput[] = [
  {
    name: 'Vishal',
    code: 'SPD/VISHAL/TTV/01',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    category: 'Printing & Decoration',
    products: 'Screen Print, DTF',
    sourceNotes: 'Row also contains KT PRINTERS, 8530718979, and VISHNU, 9923699797. Unverified association.',
  },
  {
    name: 'Shauqat',
    code: 'SPD/SHAUQAT/TTV/02',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    category: 'Printing & Decoration',
    products: 'Screen Print, DTF',
  },
  {
    name: 'Bipin',
    code: 'SPD/BIPIN/TTV/03',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING],
    category: 'Printing & Decoration',
    products: 'Screen Print, DTF',
  },
  {
    name: 'Natraj Printer',
    code: 'SPD/NATRAJ PRINTER/TTV/04',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING],
    category: 'Printing & Decoration',
    products: 'Screen',
  },
  {
    name: 'Prime',
    code: 'SPD/PRIME/TTV/05',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING],
    category: 'Printing & Decoration',
    products: 'Screen',
    phone: '9822193664',
  },
  {
    name: 'Sonali',
    code: 'SPD/SONALI/TTV/06',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING, PartnerService.SUBLIMATION],
    category: 'Printing & Decoration',
    products: 'Screen Print, DTF, Sublimation',
  },
  {
    name: 'Modgi',
    code: 'SPD/MODGI/TTV/07',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SCREEN_PRINTING, PartnerService.DTF_PRINTING, PartnerService.SUBLIMATION],
    category: 'Printing & Decoration',
    products: 'Screen Print, DTF, Sublimation',
  },
  {
    name: 'Wali',
    code: 'SUBLIMATION/WALI/TTV/08',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SUBLIMATION],
    category: 'Printing & Decoration',
    products: 'Sublimation',
  },
  {
    name: 'Vasu',
    code: 'SUBLIMATION/VASU/TTV/09',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.SUBLIMATION],
    category: 'Printing & Decoration',
    products: 'Sublimation',
  },
  {
    name: 'Shakti',
    code: 'UV/SHAKTI/TTV/010',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.UV_PRINTING],
    category: 'Printing & Decoration',
    products: 'UV',
  },
  {
    name: 'Akash',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Sandeep',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Sachin',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Zubair',
    code: 'EM /ZUBAIR /TTV/011',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [PartnerService.EMBROIDERY],
    category: 'Embroidery',
    phone: '91565 95400',
    sourceNotes: 'CREATED GROUP; CALLED. Service requires confirmation.',
  },
  {
    name: 'Tushar',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Arvind Chillal',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Sheru',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Rohan',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
  {
    name: 'Abbas',
    partnerTypes: [PartnerType.PRINTING_EMBROIDERY_PARTNER],
    services: [],
    sourceNotes: 'Services not specified; confirmation required',
  },
];

export async function seedVendors() {
  console.log('Synchronizing Vendors, Tailors, and Printing/Embroidery Partners...');

  const allPartners = [
    ...RAW_VENDOR_DETAIL_DATA,
    ...RAW_TAILORS_DETAIL_DATA,
    ...RAW_PRINTING_EMBROIDERY_DATA,
  ];

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of allPartners) {
    const normalizedLocation = item.location ? item.location.trim().toUpperCase() : null;

    // Unique match condition:
    // If code is present, match on code; otherwise match on name + (location or category)
    let existing = null;
    if (item.code) {
      existing = await prisma.vendorPartner.findUnique({
        where: { code: item.code },
      });
    }

    if (!existing) {
      existing = await prisma.vendorPartner.findFirst({
        where: {
          name: { equals: item.name, mode: 'insensitive' },
          ...(item.location ? { normalizedLocation } : {}),
        },
      });
    }

    if (existing) {
      await prisma.vendorPartner.update({
        where: { id: existing.id },
        data: {
          name: item.name,
          code: item.code || existing.code,
          partnerTypes: item.partnerTypes,
          services: item.services,
          category: item.category || existing.category,
          subcategory: item.subcategory || existing.subcategory,
          products: item.products || existing.products,
          location: item.location || existing.location,
          normalizedLocation: normalizedLocation || existing.normalizedLocation,
          phone: item.phone || existing.phone,
          sourceNotes: item.sourceNotes || existing.sourceNotes,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      await prisma.vendorPartner.create({
        data: {
          name: item.name,
          code: item.code || null,
          partnerTypes: item.partnerTypes,
          services: item.services,
          category: item.category || null,
          subcategory: item.subcategory || null,
          products: item.products || null,
          location: item.location || null,
          normalizedLocation,
          phone: item.phone || null,
          sourceNotes: item.sourceNotes || null,
          isActive: true,
          createdBy: 'IMPORT_SCRIPT',
        },
      });
      insertedCount++;
    }
  }

  console.log(`[SEED VENDORS] Processed ${allPartners.length} partners. (${insertedCount} created, ${updatedCount} updated)`);
}
