const express = require("express");
const router = express.Router();
const ArsipediaController = require("../controllers/arsipedia.controller");

router.get("/", ArsipediaController.getAll);
router.get("/:id", ArsipediaController.getById);
router.post("/", ArsipediaController.create);
router.put("/:id", ArsipediaController.update);
router.delete("/:id", ArsipediaController.delete);

module.exports = router;
