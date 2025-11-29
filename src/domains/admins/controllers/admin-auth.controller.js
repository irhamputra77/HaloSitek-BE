// src/domains/admins/controllers/admin-auth.controller.js
const adminAuthService = require('../services/admin-auth.service');

const sanitizeAdmin = (admin) => ({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
});

module.exports = {
    async registerAdmin(req, res, next) {
        try {
            const { email, password, fullName, role } = req.body;

            const { admin, token } = await adminAuthService.registerAdmin({
                email,
                password,
                fullName,
                role,
            });

            res.status(201).json({
                success: true,
                message: 'Registrasi admin berhasil',
                data: {
                    admin: sanitizeAdmin(admin),
                    token,
                },
            });
        } catch (err) {
            next(err);
        }
    },

    async loginAdmin(req, res, next) {
        try {
            const { email, password } = req.body;

            const { admin, token } = await adminAuthService.loginAdmin({
                email,
                password,
            });

            res.json({
                success: true,
                message: 'Login admin berhasil',
                data: {
                    admin: sanitizeAdmin(admin),
                    token,
                },
            });
        } catch (err) {
            next(err);
        }
    },
};
