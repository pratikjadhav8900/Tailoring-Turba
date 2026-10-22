import { seedCatalogue } from './seeds/catalogue';
import { seedProducts } from './seeds/products';
import { seedEmployees } from './seeds/employees';
import { seedVendors } from './seeds/vendors';
import { seedRMReference } from './seeds/rm-reference';

async function main() {
  await seedCatalogue();
  await seedProducts();
  await seedEmployees();
  await seedVendors();
  await seedRMReference();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
