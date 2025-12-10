/**
 * User Seeder
 * Create sample users for testing
 * 
 * Run: node src/seeds/user.seeder.js
 */

require('dotenv').config();
const prisma = require('../config/prisma-client');
const PasswordHasher = require('../utils/password-hasher');

const users = [
  {
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'User123!',
    fullName: 'John Doe',
    emailVerified: true,
  },
  {
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'User123!',
    fullName: 'Jane Smith',
    emailVerified: true,
  },
  {
    email: 'mike.wilson@example.com',
    username: 'mikewilson',
    password: 'User123!',
    fullName: 'Mike Wilson',
    emailVerified: false,
  },
  {
    email: 'sarah.jones@example.com',
    username: 'sarahjones',
    password: 'User123!',
    fullName: 'Sarah Jones',
    emailVerified: true,
  },
  {
    email: 'david.brown@example.com',
    username: 'davidbrown',
    password: 'User123!',
    fullName: 'David Brown',
    emailVerified: true,
  },
  {
    email: 'lisa.anderson@example.com',
    username: 'lisaanderson',
    password: 'User123!',
    fullName: 'Lisa Anderson',
    emailVerified: false,
  },
  {
    email: 'tom.miller@example.com',
    username: 'tommiller',
    password: 'User123!',
    fullName: 'Tom Miller',
    emailVerified: true,
  },
  {
    email: 'emma.davis@example.com',
    username: 'emmadavis',
    password: 'User123!',
    fullName: 'Emma Davis',
    emailVerified: true,
  },
  {
    email: 'chris.garcia@example.com',
    username: 'chrisgarcia',
    password: 'User123!',
    fullName: 'Chris Garcia',
    emailVerified: false,
  },
  {
    email: 'amy.martinez@example.com',
    username: 'amymartinez',
    password: 'User123!',
    fullName: 'Amy Martinez',
    emailVerified: true,
  },
];

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username },
          ],
        },
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await PasswordHasher.hash(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          fullName: userData.fullName,
          emailVerified: userData.emailVerified,
          emailVerifiedAt: userData.emailVerified ? new Date() : null,
        },
      });

      console.log(`✅ User created: ${user.email} (${user.username})`);
    }

    console.log('🎉 User seeding completed!');
  } catch (error) {
    console.error('❌ User seeding failed:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedUsers()
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

module.exports = { seedUsers };