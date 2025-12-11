const ArsipediaRepository = require("../repositories/arsipedia.repository");

class ArsipediaService {

  async create(data) {
    const { adminId } = data;

    // Validasi adminId
    const admin = await ArsipediaRepository.isAdminExist(adminId);
    if (!admin) {
      const error = new Error("Invalid adminId: Admin not found");
      error.statusCode = 400;
      throw error;
    }

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
    await this.getById(id); // cek dulu
    return ArsipediaRepository.update(id, data);
  }

  async delete(id) {
    await this.getById(id); // cek data dulu
    return ArsipediaRepository.delete(id);
  }
}

module.exports = new ArsipediaService();
