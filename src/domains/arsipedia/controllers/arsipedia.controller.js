const ArsipediaService = require("../services/arsipedia.service");
const ResponseFormatter = require("../../../utils/response-formatter");

class ArsipediaController {

  async create(req, res, next) {
    try {
      const image = req.file;
      const payload = {
        ...req.body,
        imagePath: image ? image.path : null,
      };
      const result = await ArsipediaService.create(payload);
      return ResponseFormatter.success(res, result, "Arsipedia created");
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await ArsipediaService.getAll();
      return ResponseFormatter.success(res, result, "All Arsipedia fetched");
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await ArsipediaService.getById(req.params.id);
      return ResponseFormatter.success(res, result, "Arsipedia details fetched");
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const result = await ArsipediaService.update(req.params.id, req.body);
      return ResponseFormatter.success(res, result, "Arsipedia updated");
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await ArsipediaService.delete(req.params.id);
      return ResponseFormatter.success(res, result, "Arsipedia deleted");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArsipediaController();
