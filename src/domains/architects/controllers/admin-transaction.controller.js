const service = require("../services/admin-transaction.service");

class AdminTransactionController {
    async list(req, res, next) {
        try {
            const data = await service.list(req.query);
            res.json({ success: true, message: "Transactions fetched", data });
        } catch (e) {
            next(e);
        }
    }

    async detail(req, res, next) {
        try {
            const data = await service.detail(req.params.id);
            res.json({ success: true, message: "Transaction detail fetched", data });
        } catch (e) {
            next(e);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const data = await service.updateStatus(req.params.id, req.body?.status);
            res.json({ success: true, message: "Transaction status updated", data });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AdminTransactionController();
