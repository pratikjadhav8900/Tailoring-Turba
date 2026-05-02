const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const POLO_IMGS = [
  "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1625910513825-c3c9f69f1b1f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1620359955044-33e99ac13a58?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=800&q=80",
];

const TSHIRT_IMGS = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1618354691438-25bc04584c23?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80",
];

const HOODIE_IMGS = [
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1614495086257-9cae0ca27bf3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
];

const SHIRT_IMGS = [
  "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=800&q=80",
];

const TROUSER_IMGS = [
  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1547245324-d777c6f05e80?auto=format&fit=crop&w=800&q=80",
];

function getGallery(type, name) {
  const t = (type + " " + name).toLowerCase();
  if (t.includes("trouser")) return TROUSER_IMGS;
  if (t.includes("hoodie") || t.includes("sweatshirt") || t.includes("jacket")) return HOODIE_IMGS;
  if (t.includes("shirt") || t.includes("coat")) return SHIRT_IMGS;
  if (t.includes("polo")) return POLO_IMGS;
  return TSHIRT_IMGS;
}

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Updating ${products.length} products with gallery images...`);

  for (const p of products) {
    const gallery = getGallery(p.type || "", p.name);
    await prisma.product.update({
      where: { id: p.id },
      data: { images: gallery },
    });
    console.log(`✓ ${p.name}`);
  }

  console.log("\nDone! All products now have 4 gallery images.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
