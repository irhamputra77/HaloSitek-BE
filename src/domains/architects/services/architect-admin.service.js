const path = require("path");
const architectRepository = require("../repositories/architect.repository");
const FileUploadHelper = require("../../../utils/file-upload-helper");
const { BadRequestError, NotFoundError } = require("../../../errors/app-errors");

/**
 * Hapus file upload aman:
 * - DB biasanya simpan "uploads/...."
 * - deleteFile butuh path file lokal; kita kirim apa adanya (relatif) supaya konsisten
 */
function safeDelete(filePath) {
    if (!filePath) return;
    const p = String(filePath).replace(/\\/g, "/").replace(/^\/+/, "").trim();
    if (!p) return;
    FileUploadHelper.deleteFile(p);
}

class AdminArchitectService {
    async list({ page = 1, limit = 12, status, search }) {
        const p = Number(page) || 1;
        const l = Number(limit) || 12;

        const where = {};
        if (status) where.status = String(status).toUpperCase();

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Repository kamu biasanya sudah punya findWithPagination
        return architectRepository.findWithPagination({
            page: p,
            limit: l,
            where,
            orderBy: { createdAt: "desc" },
            include: {
                certifications: true,
                portfolioLinks: true,
                // kalau repo sudah include transactions, bagus
                transactions: true,
            },
        });
    }

    async detail(id) {
        const a = await architectRepository.findByIdWithRelations(id);
        if (!a) throw new NotFoundError("Architect not found");
        return a;
    }

    async updateStatus(id, status) {
        if (!status) throw new BadRequestError("status is required");
        return architectRepository.updateStatus(id, String(status).toUpperCase());
    }

    async remove(id) {
        const a = await architectRepository.findByIdWithRelations(id);
        if (!a) throw new NotFoundError("Architect not found");

        // 1) hapus file profile picture jika ada
        safeDelete(a.profilePictureUrl);

        // 2) hapus file certifications jika field berkas menyimpan path
        if (Array.isArray(a.certifications)) {
            for (const c of a.certifications) {
                // asumsi field bernama "berkas" sesuai routes certification upload.single('berkas')
                safeDelete(c.berkas);
            }
        }

        // 3) delete data + relations (certifications, portfolioLinks, transactions, designs, dst)
        await architectRepository.deleteWithRelations(id);
        return true;
    }
}

module.exports = new AdminArchitectService();
