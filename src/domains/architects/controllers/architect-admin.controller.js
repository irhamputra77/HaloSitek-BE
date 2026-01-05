const adminArchitectService = require("../services/architect-admin.service");

class AdminArchitectController {
    async list(req, res, next) {
        try {
            const data = await adminArchitectService.list(req.query);
            res.json({ success: true, message: "Architects fetched", data });
        } catch (e) {
            next(e);
        }
    }

    async detail(req, res, next) {
        try {
            const data = await adminArchitectService.detail(req.params.id);
            res.json({ success: true, message: "Architect detail fetched", data });
        } catch (e) {
            next(e);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const data = await adminArchitectService.updateStatus(req.params.id, req.body?.status);
            res.json({ success: true, message: "Architect status updated", data });
        } catch (e) {
            next(e);
        }
    }

    async remove(req, res, next) {
        try {
            await adminArchitectService.remove(req.params.id);
            res.json({ success: true, message: "Architect deleted" });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AdminArchitectController();
