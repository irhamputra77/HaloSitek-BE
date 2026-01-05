const express = require("express");
const router = express.Router();

const viewController = require("../controllers/view.controller");
const authMiddleware = require("../../../middlewares/auth.middleware");

// user wajib login untuk "nambah view"
router.post("/arsipedia/:arsipediaId", authMiddleware.verifyUser, (req, res) =>
    viewController.trackArsipedia(req, res)
);

router.post("/architect/:architectId", authMiddleware.verifyUser, (req, res) =>
    viewController.trackArchitect(req, res)
);

// summary boleh public, tapi kalau ada token user -> bisa dapat myViews
router.get("/arsipedia/:arsipediaId/summary", authMiddleware.optionalAuth, (req, res) =>
    viewController.arsipediaSummary(req, res)
);

router.get("/architect/:architectId/summary", authMiddleware.optionalAuth, (req, res) =>
    viewController.architectSummary(req, res)
);

module.exports = router;
