// src/domains/users/controllers/admin-user.controller.js
const ResponseFormatter = require('../../../utils/response-formatter');
const adminUserService = require('../services/admin-user.service');

class AdminUserController {
    async list(req, res, next) {
        try {
            const { page, limit, search } = req.query;
            const result = await adminUserService.list({ page, limit, search });
            return ResponseFormatter.success(res, result.data || result, 'Users fetched');
        } catch (e) {
            next(e);
        }
    }

    async detail(req, res, next) {
        try {
            const data = await adminUserService.detail(req.params.id);
            return ResponseFormatter.success(res, data, 'User detail fetched');
        } catch (e) {
            next(e);
        }
    }

    async create(req, res, next) {
        try {
            const data = await adminUserService.create(req.body, req.file);
            return ResponseFormatter.created(res, data, 'User created');
        } catch (e) {
            next(e);
        }
    }

    async update(req, res, next) {
        try {
            const data = await adminUserService.update(req.params.id, req.body, req.file);
            return ResponseFormatter.success(res, data, 'User updated');
        } catch (e) {
            next(e);
        }
    }

    async remove(req, res, next) {
        try {
            await adminUserService.remove(req.params.id);
            return ResponseFormatter.success(res, null, 'User deleted');
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AdminUserController();
