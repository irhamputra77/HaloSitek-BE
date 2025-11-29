// src/domains/architects/services/architect-auth.service.js
const prisma = require('../../../config/prisma');
const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');

class ArchitectAuthService {
    async loginArsitek({ email, password }) {
        const arsitek = await prisma.arsitek.findUnique({ where: { email } });
        if (!arsitek) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const valid = await PasswordHasher.compare(password, arsitek.passwordHash);
        if (!valid) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const token = JWTHelper.generateToken({
            sub: arsitek.id,
            role: 'ARSITEK',
            type: 'arsitek',
        });

        return { arsitek, token };
    }
}

module.exports = new ArchitectAuthService();
