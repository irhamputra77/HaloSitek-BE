// src/domains/admins/repositories/admin.repository.js
const prisma = require('../../../config/prisma');

class AdminRepository {
    findByEmail(email) {
        return prisma.admin.findUnique({ where: { email } });
    }

    create({ email, passwordHash, fullName, role }) {
        return prisma.admin.create({
            data: { email, passwordHash, fullName, role },
        });
    }
}

module.exports = new AdminRepository();
