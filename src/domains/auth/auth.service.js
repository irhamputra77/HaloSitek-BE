// src/domains/auth/auth.service.js
const userAuthService = require('../users/services/user-auth.service');
const adminAuthService = require('../admins/services/admin-auth.service');
const architectAuthService = require('../architects/services/architect-auth.service');

class AuthService {
    // USER
    registerUser(payload) {
        return userAuthService.registerUser(payload);
    }

    loginUser(payload) {
        return userAuthService.loginUser(payload);
    }

    // ADMIN
    registerAdmin(payload) {
        return adminAuthService.registerAdmin(payload);
    }

    loginAdmin(payload) {
        return adminAuthService.loginAdmin(payload);
    }

    // ARSITEK
    loginArsitek(payload) {
        return architectAuthService.loginArsitek(payload);
    }
}

module.exports = new AuthService();
