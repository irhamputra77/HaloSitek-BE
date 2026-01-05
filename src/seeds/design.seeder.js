/**
 * Design Seeder
 * Create sample designs for testing (linked to existing architects)
 *
 * Run: node src/seeds/design.seeder.js
 */

require("dotenv").config();
const prisma = require("../config/prisma-client");

const PLACEHOLDER_BUILDING = [
    "https://picsum.photos/seed/halositek-building-1/1200/800",
    "https://picsum.photos/seed/halositek-building-2/1200/800",
    "https://picsum.photos/seed/halositek-building-3/1200/800",
];

const PLACEHOLDER_PLAN = [
    "https://picsum.photos/seed/halositek-plan-1/1200/800",
    "https://picsum.photos/seed/halositek-plan-2/1200/800",
];

const DESIGN_TEMPLATES = [
    {
        title: "Rumah Minimalis Modern",
        description: "Desain rumah minimalis modern dengan pencahayaan alami dan sirkulasi udara optimal.",
        kategori: "Rumah Minimalis",
        luas_bangunan: "120 m²",
        luas_tanah: "200 m²",
        foto_bangunan: JSON.stringify(PLACEHOLDER_BUILDING),
        foto_denah: JSON.stringify(PLACEHOLDER_PLAN),
    },
    {
        title: "Rumah Tropis Kontemporer",
        description: "Konsep tropis kontemporer, overhang lebar, material kayu-batu, hemat energi.",
        kategori: "Rumah Tropis",
        luas_bangunan: "160 m²",
        luas_tanah: "260 m²",
        foto_bangunan: JSON.stringify([
            "https://picsum.photos/seed/halositek-tropis-1/1200/800",
            "https://picsum.photos/seed/halositek-tropis-2/1200/800",
        ]),
        foto_denah: JSON.stringify([
            "https://picsum.photos/seed/halositek-tropis-plan-1/1200/800",
        ]),
    },
    {
        title: "Cafe Industrial Modern",
        description: "Cafe konsep industrial modern dengan zoning jelas dan seating fleksibel.",
        kategori: "Komersial",
        luas_bangunan: "220 m²",
        luas_tanah: "350 m²",
        foto_bangunan: JSON.stringify([
            "https://picsum.photos/seed/halositek-cafe-1/1200/800",
            "https://picsum.photos/seed/halositek-cafe-2/1200/800",
        ]),
        foto_denah: JSON.stringify([
            "https://picsum.photos/seed/halositek-cafe-plan-1/1200/800",
            "https://picsum.photos/seed/halositek-cafe-plan-2/1200/800",
        ]),
    },
];

const TARGET_ARCHITECT_EMAILS = [
    "budi.santoso@architect.com",
    "siti.rahayu@architect.com",
    "ahmad.hidayat@architect.com",
    "dewi.lestari@architect.com",
    "eko.prasetyo@architect.com",
];

async function seedDesigns() {
    try {
        console.log("🌱 Seeding designs...");

        const architects = await prisma.architect.findMany({
            where: { email: { in: TARGET_ARCHITECT_EMAILS } },
            select: { id: true, email: true, name: true },
        });

        if (!architects.length) {
            console.log("⚠️  Tidak ada architect target. Jalankan architect.seeder.js dulu.");
            return;
        }

        for (const arch of architects) {
            // bikin 2 desain per architect (ambil 2 template pertama, biar konsisten)
            const picked = DESIGN_TEMPLATES.slice(0, 2);

            for (const tpl of picked) {
                // supaya title unik per architect (optional tapi aman)
                const uniqueTitle = `${tpl.title} - ${arch.name}`;

                // skip kalau sudah ada
                const exists = await prisma.design.findFirst({
                    where: { architectId: arch.id, title: uniqueTitle },
                    select: { id: true },
                });

                if (exists) {
                    console.log(`⚠️  Design already exists: ${arch.email} | ${uniqueTitle}`);
                    continue;
                }

                await prisma.design.create({
                    data: {
                        architectId: arch.id,
                        title: uniqueTitle,
                        description: tpl.description,
                        kategori: tpl.kategori,
                        luas_bangunan: tpl.luas_bangunan,
                        luas_tanah: tpl.luas_tanah,
                        foto_bangunan: tpl.foto_bangunan, // JSON string array
                        foto_denah: tpl.foto_denah,       // JSON string array
                    },
                });

                console.log(`✅ Design created: ${arch.email} | ${uniqueTitle}`);
            }
        }

        console.log("🎉 Design seeding completed!");
    } catch (error) {
        console.error("❌ Design seeding failed:", error);
        throw error;
    }
}

// Run seeder if called directly
if (require.main === module) {
    seedDesigns()
        .then(() => {
            console.log("✅ Done!");
            process.exit(0);
        })
        .catch(() => process.exit(1))
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { seedDesigns };
