require('dotenv/config');
const { prisma } = require('./src/lib/prisma');

async function test() {
  try {
    const count = await prisma.booking.count();
    console.log('Booking count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
