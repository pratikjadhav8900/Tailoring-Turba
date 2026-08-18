import { seedCatalogue } from './seeds/catalogue';
import { seedProducts } from './seeds/products';

async function main() {
  await seedCatalogue();
  await seedProducts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
