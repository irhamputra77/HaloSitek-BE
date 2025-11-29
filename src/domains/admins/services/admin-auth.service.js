// src/domains/admins/services/admin-auth.service.js
const adminRepository = require('../repositories/admin.repository');
const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');

class AdminAuthService {
    async registerAdmin({ email, password, fullName, role = 'ADMIN' }) {
        const existing = await adminRepository.findByEmail(email);
        if (existing) {
            const err = new Error('Email sudah digunakan');
            err.status = 400;
            throw err;
        }

        const passwordHash = await PasswordHasher.hash(password);

        const admin = await adminRepository.create({
            email,
            passwordHash,
            fullName,
            role,
        });

        const token = JWTHelper.generateToken({
            sub: admin.id,
            role: admin.role,
            type: 'admin',
        });

        return { admin, token };
    }

    async loginAdmin({ email, password }) {
        const admin = await adminRepository.findByEmail(email);
        if (!admin) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const valid = await PasswordHasher.compare(password, admin.passwordHash);
        if (!valid) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const token = JWTHelper.generateToken({
            sub: admin.id,
            role: admin.role,
            type: 'admin',
        });

        return { admin, token };
    }
}

module.exports = new AdminAuthService();
