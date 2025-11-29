// src/domains/users/repositories/user.repository.js
const prisma = require('../../../config/prisma');

class UserRepository {
    findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }

    findByUsername(username) {
        return prisma.user.findUnique({ where: { username } });
    }

    create({ email, username, passwordHash, fullName }) {
        return prisma.user.create({
            data: { email, username, passwordHash, fullName },
        });
    }
}

module.exports = new UserRepository();
