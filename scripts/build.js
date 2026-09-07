const { execSync } = require('child_process');

console.log('🏁 Running custom build runner...');

try {
  // 1. Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Build Next.js (Database schema migrations must be run independently via 'prisma migrate deploy')
  console.log('🚀 Compiling Next.js production build...');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('✨ Build process finished successfully!');
} catch (error) {
  console.error('❌ Build runner failed:', error.message);
  process.exit(1);
}
