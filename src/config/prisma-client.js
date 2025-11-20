/**
 * Prisma Client Configuration
 * Singleton pattern untuk Prisma Client instance
 * Mencegah multiple instances di development
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client Options
 */
const prismaOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
};

/**
 * Singleton Prisma Client
 * Menggunakan global object untuk prevent multiple instances
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaOptions);
} else {
  // Development: reuse existing instance to prevent hot reload issues
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  prisma = global.prisma;
}

/**
 * Graceful shutdown
 * Disconnect Prisma saat aplikasi di-shutdown
 */
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting Prisma Client...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('\n🔌 Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔌 Disconnecting Prisma Client...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;