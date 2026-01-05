/**
 * Arsipedia Seeder
 * Create sample arsipedia articles for testing (linked to existing admins)
 *
 * Run: node src/seeds/arsipedia.seeder.js
 */

require("dotenv").config();
const prisma = require("../config/prisma-client");

// pakai URL placeholder agar tidak tergantung file uploads lokal
const PLACEHOLDER_IMAGES = [
    "https://picsum.photos/seed/arsipedia-1/1200/800",
    "https://picsum.photos/seed/arsipedia-2/1200/800",
    "https://picsum.photos/seed/arsipedia-3/1200/800",
    "https://picsum.photos/seed/arsipedia-4/1200/800",
    "https://picsum.photos/seed/arsipedia-5/1200/800",
    "https://picsum.photos/seed/arsipedia-6/1200/800",
];

const ARSIPEDIA_TEMPLATES = [
    {
        title: "Arsitektur Vernakular Nusantara",
        content:
            "Arsitektur vernakular tumbuh dari kebutuhan lokal, material setempat, dan adaptasi terhadap iklim. Artikel ini membahas prinsip vernakular serta contoh umum di Indonesia: bentuk atap, ventilasi silang, dan penggunaan material alami.\n\nFokus pembahasan: konteks budaya, faktor iklim, dan implikasi desain modern yang mengadopsi nilai vernakular.",
        status: "PUBLISHED",
        tags: JSON.stringify(["Vernakular", "Nusantara", "Material Lokal"]),
        imagePath: PLACEHOLDER_IMAGES[0],
    },
    {
        title: "Modernisme: Dari Bauhaus ke Kontemporer",
        content:
            "Modernisme menekankan fungsi, kesederhanaan bentuk, dan efisiensi. Artikel ini mengulas pengaruh Bauhaus dan International Style, serta bagaimana prinsip modern kemudian berkembang menjadi praktik kontemporer.\n\nFokus pembahasan: fungsi ruang, bahasa fasade, dan peran teknologi konstruksi.",
        status: "PUBLISHED",
        tags: JSON.stringify(["Modern", "Bauhaus", "Minimalis"]),
        imagePath: PLACEHOLDER_IMAGES[1],
    },
    {
        title: "Dasar Struktur: Beban, Bentang, dan Stabilitas",
        content:
            "Memahami beban mati, beban hidup, serta jalur beban membantu perancang menilai stabilitas struktur sejak tahap konsep. Artikel ini merangkum konsep paling sering dipakai dalam analisis awal.\n\nFokus pembahasan: grid struktur, bentang efektif, dan logika penyaluran beban.",
        status: "PUBLISHED",
        tags: JSON.stringify(["Struktur", "Beban", "Stabilitas"]),
        imagePath: PLACEHOLDER_IMAGES[2],
    },
    {
        title: "BIM untuk Kolaborasi Proyek",
        content:
            "BIM mendukung integrasi model dan data lintas disiplin. Artikel ini membahas manfaat BIM pada koordinasi desain, clash detection, dan konsistensi dokumen.\n\nFokus pembahasan: workflow kolaborasi, manajemen perubahan, dan standar naming/LOD.",
        status: "PUBLISHED",
        tags: JSON.stringify(["BIM", "Koordinasi", "Kolaborasi"]),
        imagePath: PLACEHOLDER_IMAGES[3],
    },
    {
        title: "Membaca Tapak: Orientasi Matahari dan Angin",
        content:
            "Analisis tapak mencakup orientasi matahari, pola angin, akses, serta konteks lingkungan. Artikel ini memberikan kerangka ringkas untuk pengambilan keputusan desain pada tahap awal.\n\nFokus pembahasan: shading, ventilasi alami, dan zonasi ruang.",
        status: "PUBLISHED",
        tags: JSON.stringify(["Tapak", "Iklim", "Orientasi"]),
        imagePath: PLACEHOLDER_IMAGES[4],
    },
    {
        title: "Detail Fasade: Material, Sambungan, dan Performa",
        content:
            "Fasade bukan hanya estetika, tetapi juga sistem performa (panas, hujan, dan cahaya). Artikel ini membahas material umum, detail sambungan, serta pertimbangan pemeliharaan.\n\nFokus pembahasan: waterproofing, thermal bridge, dan strategi daylighting.",
        status: "PUBLISHED",
        tags: JSON.stringify(["Fasade", "Material", "Detail"]),
        imagePath: PLACEHOLDER_IMAGES[5],
    },
];

async function seedArsipedia() {
    try {
        console.log("🌱 Seeding arsipedia...");

        // ambil admin pertama yang ada
        const admin = await prisma.admin.findFirst({
            select: { id: true, email: true, fullName: true },
            orderBy: { createdAt: "asc" },
        });

        if (!admin) {
            console.log("⚠️  Tidak ada admin. Buat admin dulu sebelum menjalankan arsipedia.seeder.js.");
            return;
        }

        for (const tpl of ARSIPEDIA_TEMPLATES) {
            // skip kalau sudah ada title yang sama untuk admin ini
            const exists = await prisma.arsipedia.findFirst({
                where: { adminId: admin.id, title: tpl.title },
                select: { id: true },
            });

            if (exists) {
                console.log(`⚠️  Arsipedia already exists: ${admin.email} | ${tpl.title}`);
                continue;
            }

            await prisma.arsipedia.create({
                data: {
                    adminId: admin.id,
                    title: tpl.title,
                    content: tpl.content,
                    status: tpl.status ?? "DRAFT",
                    tags: tpl.tags ?? null, // String JSON
                    imagePath: tpl.imagePath, // wajib
                },
            });

            console.log(`✅ Arsipedia created: ${admin.email} | ${tpl.title}`);
        }

        console.log("🎉 Arsipedia seeding completed!");
    } catch (error) {
        console.error("❌ Arsipedia seeding failed:", error);
        throw error;
    }
}

// Run seeder if called directly
if (require.main === module) {
    seedArsipedia()
        .then(() => {
            console.log("✅ Done!");
            process.exit(0);
        })
        .catch(() => process.exit(1))
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = { seedArsipedia };
