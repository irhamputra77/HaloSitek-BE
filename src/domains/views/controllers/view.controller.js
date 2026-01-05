const ResponseFormatter = require("../../../utils/response-formatter");
const viewService = require("../services/view.service");

class ViewController {
    // POST /views/arsipedia/:arsipediaId  (mounted => /api/views/arsipedia/:arsipediaId)
    async trackArsipedia(req, res) {
        const userId = req.user?.id;
        const { arsipediaId } = req.params;

        const data = await viewService.incrementArsipediaView(userId, arsipediaId);
        return ResponseFormatter.success(res, data, "Arsipedia view recorded");
    }

    // POST /views/architect/:architectId
    async trackArchitect(req, res) {
        const userId = req.user?.id;
        const { architectId } = req.params;

        const data = await viewService.incrementArchitectView(userId, architectId);
        return ResponseFormatter.success(res, data, "Architect view recorded");
    }

    // GET /views/arsipedia/:arsipediaId/summary  (optional auth)
    async arsipediaSummary(req, res) {
        const userId = req.user?.id || null;
        const { arsipediaId } = req.params;

        const data = await viewService.getArsipediaSummary(arsipediaId, userId);
        return ResponseFormatter.success(res, data, "Arsipedia views summary");
    }

    // GET /views/architect/:architectId/summary  (optional auth)
    async architectSummary(req, res) {
        const userId = req.user?.id || null;
        const { architectId } = req.params;

        const data = await viewService.getArchitectSummary(architectId, userId);
        return ResponseFormatter.success(res, data, "Architect views summary");
    }
}

module.exports = new ViewController();
