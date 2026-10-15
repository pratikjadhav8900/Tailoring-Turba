import { seedCatalogue } from './seeds/catalogue';
import { seedProducts } from './seeds/products';
import { seedEmployees } from './seeds/employees';

async function main() {
  await seedCatalogue();
  await seedProducts();
  await seedEmployees();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
