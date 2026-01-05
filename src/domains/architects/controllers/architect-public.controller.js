const ResponseFormatter = require("../../../utils/response-formatter");
const architectRepository = require("../repositories/architect.repository");

class ArchitectPublicController {
    async list(req, res, next) {
        try {
            const page = parseInt(req.query.page || "1", 10);
            const limit = parseInt(req.query.limit || "10", 10);
            const q = (req.query.q || "").trim();

            const result = q
                ? await architectRepository.search(q, { page, limit })
                : await architectRepository.findActiveArchitects({ page, limit });

            return ResponseFormatter.success(res, result, "Architect list retrieved successfully");
        } catch (err) {
            next(err);
        }
    }

    async detail(req, res, next) {
        try {
            const { id } = req.params;

            // pakai relasi (agar certifications/portfolioLinks/designs ikut)
            const architect = await architectRepository.findByIdWithRelations(id);

            // Batasi hanya ACTIVE (biar yang UNPAID/BANNED tidak kebuka)
            if (!architect || architect.status !== "ACTIVE") {
                return ResponseFormatter.notFound(res, "Architect not found");
            }

            return ResponseFormatter.success(res, architect, "Architect detail retrieved successfully");
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ArchitectPublicController();
