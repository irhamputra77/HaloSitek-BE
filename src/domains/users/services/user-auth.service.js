// src/domains/users/services/user-auth.service.js
const prisma = require('../../../config/prisma');
const userRepository = require('../repositories/user.repository');
const PasswordHasher = require('../../../utils/password-hasher');
const JWTHelper = require('../../../utils/jwt-helper');

class UserAuthService {
    async registerUser({ email, username, password, fullName }) {
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
            const err = new Error('Email sudah digunakan');
            err.status = 400;
            throw err;
        }

        const existingUsername = await userRepository.findByUsername(username);
        if (existingUsername) {
            const err = new Error('Username sudah digunakan');
            err.status = 400;
            throw err;
        }

        const passwordHash = await PasswordHasher.hash(password);

        const user = await userRepository.create({
            email,
            username,
            passwordHash,
            fullName,
        });

        // Payload dibiarkan sama seperti sebelumnya
        const token = JWTHelper.generateToken({
            sub: user.id,
            role: 'USER',
            type: 'user',
        });

        return { user, token };
    }

    async loginUser({ email, password }) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const valid = await PasswordHasher.compare(password, user.passwordHash);
        if (!valid) {
            const err = new Error('Email atau password salah');
            err.status = 401;
            throw err;
        }

        const token = JWTHelper.generateToken({
            sub: user.id,
            role: 'USER',
            type: 'user',
        });

        return { user, token };
    }
}

module.exports = new UserAuthService();
