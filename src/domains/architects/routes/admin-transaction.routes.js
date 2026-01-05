const express = require("express");
const router = express.Router();

const controller = require("../controllers/admin-transaction.controller");
const authMiddleware = require("../../../middlewares/auth.middleware");

// GET /api/admin/transactions?status=SUCCESS&search=ORDER&page=1&limit=20&architectId=...
router.get("/", authMiddleware.verifyAdmin, controller.list);

// GET /api/admin/transactions/:id
router.get("/:id", authMiddleware.verifyAdmin, controller.detail);

// PATCH /api/admin/transactions/:id/status { status: "SUCCESS|PENDING|FAILED|EXPIRED" }
router.patch("/:id/status", authMiddleware.verifyAdmin, controller.updateStatus);

module.exports = router;
