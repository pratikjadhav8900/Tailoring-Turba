const { execSync } = require('child_process');

console.log('🏁 Running custom build runner...');

try {
  // 1. Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Conditionally run database schema sync and seeding
  if (process.env.DATABASE_URL) {
    console.log('🔗 DATABASE_URL detected. Syncing database schema (db push)...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

    console.log('🌱 Seeding database initial catalogue...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
  } else {
    console.log('⚠️ DATABASE_URL not detected. Skipping migrations & seeding (will build with fallback static data).');
  }

  // 3. Build Next.js
  console.log('🚀 Compiling Next.js production build...');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('✨ Build process finished successfully!');
} catch (error) {
  console.error('❌ Build runner failed:', error.message);
  process.exit(1);
}
