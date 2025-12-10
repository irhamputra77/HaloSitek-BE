/**
 * Architect Seeder
 * Create sample architects for testing (with ACTIVE status)
 * 
 * Run: node src/seeds/architect.seeder.js
 */

require('dotenv').config();
const prisma = require('../config/prisma-client');
const PasswordHasher = require('../utils/password-hasher');
const TokenGeneratorService = require('../common/services/token-generator.service');

const architects = [
  {
    email: 'budi.santoso@architect.com',
    password: 'Architect123!',
    name: 'Budi Santoso',
    phone: '081234567890',
    status: 'ACTIVE',
    tahunPengalaman: 15,
    areaPengalaman: 'Desain Rumah Minimalis, Renovasi, Interior Design',
    keahlianKhusus: JSON.stringify(['AutoCAD', 'SketchUp', '3ds Max', 'Revit']),
    certifications: [
      {
        certificationName: 'Arsitek Berlisensi IAI',
        penerbit: 'Ikatan Arsitek Indonesia (IAI)',
        year: 2010,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
      {
        certificationName: 'Certified Green Building Professional',
        penerbit: 'Green Building Council Indonesia',
        year: 2015,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
    ],
    portfolioLinks: [
      { url: 'https://www.behance.net/budisantoso', order: 0 },
      { url: 'https://www.instagram.com/budisantoso_architect', order: 1 },
    ],
  },
  {
    email: 'siti.rahayu@architect.com',
    password: 'Architect123!',
    name: 'Siti Rahayu',
    phone: '082345678901',
    status: 'ACTIVE',
    tahunPengalaman: 10,
    areaPengalaman: 'Arsitektur Tropis, Desain Berkelanjutan, Landscape',
    keahlianKhusus: JSON.stringify(['AutoCAD', 'SketchUp', 'Lumion', 'Photoshop']),
    certifications: [
      {
        certificationName: 'Arsitek Profesional',
        penerbit: 'IAI Jakarta',
        year: 2013,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
    ],
    portfolioLinks: [
      { url: 'https://www.pinterest.com/sitirahayu', order: 0 },
      { url: 'https://www.houzz.com/pro/sitirahayu', order: 1 },
    ],
  },
  {
    email: 'ahmad.hidayat@architect.com',
    password: 'Architect123!',
    name: 'Ahmad Hidayat',
    phone: '083456789012',
    status: 'ACTIVE',
    tahunPengalaman: 8,
    areaPengalaman: 'Desain Komersial, Cafe & Restaurant, Modern Contemporary',
    keahlianKhusus: JSON.stringify(['AutoCAD', '3ds Max', 'V-Ray', 'Enscape']),
    certifications: [
      {
        certificationName: 'Registered Architect',
        penerbit: 'Kementerian PUPR',
        year: 2016,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
      {
        certificationName: 'Interior Design Specialist',
        penerbit: 'HDII (Himpunan Desainer Interior Indonesia)',
        year: 2018,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
    ],
    portfolioLinks: [
      { url: 'https://www.archdaily.com/ahmadh', order: 0 },
    ],
  },
  {
    email: 'dewi.lestari@architect.com',
    password: 'Architect123!',
    name: 'Dewi Lestari',
    phone: '084567890123',
    status: 'ACTIVE',
    tahunPengalaman: 12,
    areaPengalaman: 'Residential Design, Eco-Friendly Architecture, Space Planning',
    keahlianKhusus: JSON.stringify(['Revit', 'AutoCAD', 'SketchUp', 'ArchiCAD']),
    certifications: [
      {
        certificationName: 'LEED Accredited Professional',
        penerbit: 'US Green Building Council',
        year: 2014,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
    ],
    portfolioLinks: [
      { url: 'https://www.linkedin.com/in/dewilestari-architect', order: 0 },
      { url: 'https://www.dezeen.com/dewilestari', order: 1 },
    ],
  },
  {
    email: 'eko.prasetyo@architect.com',
    password: 'Architect123!',
    name: 'Eko Prasetyo',
    phone: '085678901234',
    status: 'ACTIVE',
    tahunPengalaman: 20,
    areaPengalaman: 'Heritage Conservation, Traditional Architecture, Urban Design',
    keahlianKhusus: JSON.stringify(['AutoCAD', 'Revit', 'BIM', 'Rhino']),
    certifications: [
      {
        certificationName: 'Master Architect',
        penerbit: 'Ikatan Arsitek Indonesia',
        year: 2005,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
      {
        certificationName: 'Heritage Conservation Specialist',
        penerbit: 'UNESCO Asia-Pacific',
        year: 2010,
        berkasUrl: 'uploads/temp/cert-dummy.pdf',
      },
    ],
    portfolioLinks: [
      { url: 'https://www.architizer.com/firms/ekoprasetyo', order: 0 },
    ],
  },
];

async function seedArchitects() {
  try {
    console.log('🌱 Seeding architects...');

    for (const architectData of architects) {
      // Check if architect already exists
      const existingArchitect = await prisma.architect.findUnique({
        where: { email: architectData.email },
      });

      if (existingArchitect) {
        console.log(`⚠️  Architect already exists: ${architectData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await PasswordHasher.hash(architectData.password);

      // Create architect with certifications and portfolio links
      const architect = await prisma.architect.create({
        data: {
          email: architectData.email,
          password: hashedPassword,
          name: architectData.name,
          phone: architectData.phone,
          status: architectData.status,
          tahunPengalaman: architectData.tahunPengalaman,
          areaPengalaman: architectData.areaPengalaman,
          keahlianKhusus: architectData.keahlianKhusus,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          certifications: {
            create: architectData.certifications,
          },
          portfolioLinks: {
            create: architectData.portfolioLinks,
          },
        },
        include: {
          certifications: true,
          portfolioLinks: true,
        },
      });

      // Create a SUCCESS transaction for this architect
      const orderId = TokenGeneratorService.generateOrderId();
      const paymentToken = TokenGeneratorService.generatePaymentToken();
      
      await prisma.transaction.create({
        data: {
          architectId: architect.id,
          orderId,
          paymentToken,
          amount: 500000,
          status: 'SUCCESS',
          paymentMethod: 'BANK_TRANSFER',
          paidAt: new Date(),
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      console.log(`✅ Architect created: ${architect.email} (ACTIVE with ${architect.certifications.length} certifications)`);
    }

    console.log('🎉 Architect seeding completed!');
  } catch (error) {
    console.error('❌ Architect seeding failed:', error);
    throw error;
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedArchitects()
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

module.exports = { seedArchitects };