import { seedCatalogue } from './seeds/catalogue';

async function main() {
  await seedCatalogue();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
