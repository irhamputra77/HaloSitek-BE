const express = require("express");
const router = express.Router();

const adminArchitectController = require("../controllers/architect-admin.controller");
const authMiddleware = require("../../../middlewares/auth.middleware");

// GET /api/admin/architects?status=ACTIVE&search=eko&page=1&limit=12
router.get("/", authMiddleware.verifyAdmin, adminArchitectController.list);

// GET /api/admin/architects/:id
router.get("/:id", authMiddleware.verifyAdmin, adminArchitectController.detail);

// PATCH /api/admin/architects/:id/status { status: "ACTIVE|UNPAID|BANNED" }
router.patch("/:id/status", authMiddleware.verifyAdmin, adminArchitectController.updateStatus);

// DELETE /api/admin/architects/:id (hapus + cleanup relasi/file)
router.delete("/:id", authMiddleware.verifyAdmin, adminArchitectController.remove);

module.exports = router;
