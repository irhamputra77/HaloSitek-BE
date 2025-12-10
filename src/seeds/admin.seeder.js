/**
 * Admin Seeder
 * Create default admin accounts
 * 
 * Run: node src/seeds/admin.seeder.js
 */

require('dotenv').config();
const prisma = require('../config/prisma-client');
const PasswordHasher = require('../utils/password-hasher');

const admins = [
  {
    email: 'admin@halositek.com',
    password: 'Admin123!',
    fullName: 'Super Admin',
    role: 'ADMIN',
  },
  {
    email: 'admin2@halositek.com',
    password: 'Admin123!',
    fullName: 'Admin Manager',
    role: 'ADMIN',
  },
];

async function seedAdmins() {
  try {
    console.log('🌱 Seeding admins...');

    for (const adminData of admins) {
      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: adminData.email },
      });

      if (existingAdmin) {
        console.log(`⚠️  Admin already exists: ${adminData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await PasswordHasher.hash(adminData.password);

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          fullName: adminData.fullName,
          role: adminData.role,
        },
      });

      console.log(`✅ Admin created: ${admin.email}`);
    }

    console.log('🎉 Admin seeding completed!');
  } catch (error) {
    console.error('❌ Admin seeding failed:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAdmins()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedAdmins };