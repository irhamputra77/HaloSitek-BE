// src/domains/users/services/admin-user.service.js
const { userRepository } = require('../repositories');
const PasswordHasher = require('../../../utils/password-hasher');
const FileUploadHelper = require('../../../utils/file-upload-helper');
const { ValidationError, NotFoundError } = require('../../../errors/app-errors');

class AdminUserService {
    async list({ page = 1, limit = 12, search = "" }) {
        const p = Number(page) || 1;
        const l = Number(limit) || 12;

        if (search && search.trim()) {
            return await userRepository.search(search.trim(), { page: p, limit: l });
        }

        return await userRepository.findUsers({ page: p, limit: l });
    }

    async detail(id) {
        const user = await userRepository.findByIdOrFail(id);

        // samakan format dengan service userAuth (pakai FileUploadHelper.getFileUrl)
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            profilePictureUrl: user.profilePictureUrl ? FileUploadHelper.getFileUrl(user.profilePictureUrl) : null,
            emailVerified: user.emailVerified,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async create(payload, file = null) {
        const errors = [];
        if (!payload.email) errors.push({ field: 'email', message: 'Email is required' });
        if (!payload.username) errors.push({ field: 'username', message: 'Username is required' });
        if (!payload.password) errors.push({ field: 'password', message: 'Password is required' });
        if (!payload.fullName) errors.push({ field: 'fullName', message: 'Full name is required' });
        if (errors.length) throw new ValidationError('Validation failed', errors);

        const hashedPassword = await PasswordHasher.hash(payload.password);

        const user = await userRepository.createUser({
            email: payload.email,
            username: payload.username,
            password: hashedPassword,
            fullName: payload.fullName,
            profilePictureUrl: file ? file.path : null,
            emailVerified: Boolean(payload.emailVerified) || false,
        });

        return await this.detail(user.id);
    }

    async update(id, payload, file = null) {
        const user = await userRepository.findByIdOrFail(id);

        const updateData = {};
        if (payload.fullName !== undefined) updateData.fullName = payload.fullName;
        if (payload.email !== undefined) updateData.email = payload.email;
        if (payload.username !== undefined) updateData.username = payload.username;

        // admin boleh set emailVerified
        if (payload.emailVerified !== undefined) {
            updateData.emailVerified = Boolean(payload.emailVerified);
            updateData.emailVerifiedAt = updateData.emailVerified ? (user.emailVerifiedAt || new Date()) : null;
        }

        if (payload.password) {
            updateData.password = await PasswordHasher.hash(payload.password);
        }

        if (file) {
            if (user.profilePictureUrl) FileUploadHelper.deleteFile(user.profilePictureUrl);
            updateData.profilePictureUrl = file.path;
        }

        await userRepository.updateProfile(id, updateData);
        return await this.detail(id);
    }

    async remove(id) {
        const user = await userRepository.findByIdOrFail(id);
        if (user.profilePictureUrl) FileUploadHelper.deleteFile(user.profilePictureUrl);
        await userRepository.deleteUser(id);
        return true;
    }
}

module.exports = new AdminUserService();
