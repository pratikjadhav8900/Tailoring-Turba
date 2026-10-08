const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const nextDir = path.join(rootDir, '.next');

console.log('🧹 Cleaning Next.js build and cache directory (.next)...');

try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Removed corrupted .next cache successfully.');
  } else {
    console.log('ℹ️ No .next directory found. Cache is already clean.');
  }
} catch (err) {
  console.warn('⚠️ Warning while removing .next:', err.message);
}

console.log('🚀 Starting fresh Next.js development server...');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['next', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
