const path = require("path");
const fs = require("fs");
const ArsipediaRepository = require("../repositories/arsipedia.repository");

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

  async create(data) {
    const adminId = data.adminId;
    const imagePath = data.imagePath;

    const admin = await ArsipediaRepository.isAdminExist(adminId);
    if (!admin) {
      const error = new Error("Invalid adminId: Admin not found");
      error.statusCode = 400;
      throw error;
    }

    if (!imagePath) {
      const error = new Error("Image is required");
      error.statusCode = 400;
      throw error;
    }

    data.tags = await this.normalizeTagsToJsonString(data.tags);
    return await ArsipediaRepository.create(data);
  }

  async getAll() {
    return ArsipediaRepository.getAll();
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

module.exports = new ArsipediaService();
