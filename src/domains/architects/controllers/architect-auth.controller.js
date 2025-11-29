// src/domains/architects/controllers/architect-auth.controller.js
const architectAuthService = require('../services/architect-auth.service');

const sanitizeArsitek = (arsitek) => ({
    id: arsitek.id,
    email: arsitek.email,
    name: arsitek.name,
});

module.exports = {
    async loginArsitek(req, res, next) {
        try {
            const { email, password } = req.body;

            const { arsitek, token } = await architectAuthService.loginArsitek({
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
