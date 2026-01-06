const path = require("path");
const fs = require("fs");
const ArsipediaRepository = require("../repositories/arsipedia.repository");
const FileUploadHelper = require("../../../utils/file-upload-helper");


class ArsipediaService {

  normalizeTagsToJsonString(tags) {
    if (!tags) return "[]";

    // tags dikirim sebagai array
    if (Array.isArray(tags)) {
      return JSON.stringify(tags.map(String));
    }

    // tags dikirim sebagai string
    if (typeof tags === "string") {
      const s = tags.trim();
      if (!s) return "[]";

      // kalau sudah JSON string array
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return JSON.stringify(parsed.map(String));
      } catch { }

      // fallback: comma-separated
      const arr = s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      return JSON.stringify(arr);
    }

    return "[]";
  }

  async create(data, imageFile) {
    const adminId = data.adminId;

    const admin = await ArsipediaRepository.isAdminExist(adminId);
    if (!admin) {
      const error = new Error("Invalid adminId: Admin not found");
      error.statusCode = 400;
      throw error;
    }

    if (!imageFile) {
      const error = new Error("Image is required");
      error.statusCode = 400;
      throw error;
    }

    // ✅ simpan sebagai URL cloud / path lokal
    data.imagePath = await FileUploadHelper.persistFile(imageFile, "arsipedia_images");

    data.tags = await this.normalizeTagsToJsonString(data.tags);
    return await ArsipediaRepository.create(data);
  }


  async delete(id) {
    const existing = await this.getById(id);

    if (existing?.imagePath) {
      await FileUploadHelper.safeDeleteFile(existing.imagePath);
    }

    return ArsipediaRepository.delete(id);
  }
  async getById(id) {
    const data = await ArsipediaRepository.getById(id);
    if (!data) {
      const error = new Error("Arsipedia entry not found");
      error.statusCode = 404;
      throw error;
    }
    return data;
  }

  async update(id, data) {
    await this.getById(id);
    data.tags = await this.normalizeTagsToJsonString(data.tags);
    return ArsipediaRepository.update(id, data);
  }

  async delete(id) {
    const existing = await this.getById(id);

    if (existing?.imagePath) {
      const normalized = String(existing.imagePath).replace(/\\/g, "/");

      const absPath = path.resolve(process.cwd(), normalized);

      try {
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
        }
      } catch (err) {
        console.warn("[ArsipediaService.delete] Failed deleting file:", absPath, err.message);
      }
    }

    return ArsipediaRepository.delete(id);
  }
}

const service = new ArsipediaService();

module.exports.create = (...args) => service.create(...args);
module.exports.getAll = (...args) => service.getAll(...args);
module.exports.getById = (...args) => service.getById(...args);
module.exports.update = (...args) => service.update(...args);
module.exports.delete = (...args) => service.delete(...args);
module.exports.normalizeTagsToJsonString = (...args) => service.normalizeTagsToJsonString(...args);

