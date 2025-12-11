const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ArsipediaRepository {
  async create(data) {
    return prisma.arsipedia.create({ data });
  }

  async getAll() {
    return prisma.arsipedia.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id) {
    return prisma.arsipedia.findUnique({ where: { id } });
  }

  async update(id, data) {
    return prisma.arsipedia.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.arsipedia.delete({ where: { id } });
  }

  async isAdminExist(adminId) {
    return prisma.admin.findUnique({ where: { id: adminId } });
  }
}

module.exports = new ArsipediaRepository();
