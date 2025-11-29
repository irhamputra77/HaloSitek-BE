// src/domains/users/controllers/user-auth.controller.js
const userAuthService = require('../services/user-auth.service');

const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    createdAt: user.createdAt,
    profilePictureUrl: user.profilePictureUrl,
});

module.exports = {
    async registerUser(req, res, next) {
        try {
            const { email, username, password, fullName } = req.body;

            const { user, token } = await userAuthService.registerUser({
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

            const { user, token } = await userAuthService.loginUser({
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
};
