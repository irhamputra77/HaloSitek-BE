// src/domains/auth/auth.controller.js
const authService = require('./auth.service');

const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    createdAt: user.createdAt,
    profilePictureUrl: user.profilePictureUrl,
});

const sanitizeAdmin = (admin) => ({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
});

const sanitizeArsitek = (arsitek) => ({
    id: arsitek.id,
    email: arsitek.email,
    name: arsitek.name,
});

module.exports = {
    async registerUser(req, res, next) {
        try {
            const { email, username, password, fullName } = req.body;

            const { user, token } = await authService.registerUser({
                email,
                username,
                password,
                fullName,
            });

            res.status(201).json({
                success: true,
                message: 'Registrasi user berhasil',
                data: {
                    user: sanitizeUser(user),
                    token,
                },
            });
        } catch (err) {
            next(err);
        }
    },

    async loginUser(req, res, next) {
        try {
            const { email, password } = req.body;

            const { user, token } = await authService.loginUser({
                email,
                password,
            });

            res.json({
                success: true,
                message: 'Login user berhasil',
                data: {
                    user: sanitizeUser(user),
                    token,
                },
            });
        } catch (err) {
            next(err);
        }
    },

    async registerAdmin(req, res, next) {
        try {
            const { email, password, fullName, role } = req.body;

            const { admin, token } = await authService.registerAdmin({
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

            const { admin, token } = await authService.loginAdmin({
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

    async loginArsitek(req, res, next) {
        try {
            const { email, password } = req.body;

            const { arsitek, token } = await authService.loginArsitek({
                email,
                password,
            });

            res.json({
                success: true,
                message: 'Login arsitek berhasil',
                data: {
                    arsitek: sanitizeArsitek(arsitek),
                    token,
                },
            });
        } catch (err) {
            next(err);
        }
    },
};
