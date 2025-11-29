// src/domains/auth/auth.routes.js
const express = require('express');
const controller = require('./auth.controller');

const router = express.Router();

// User
router.post('/user/register', controller.registerUser);
router.post('/user/login', controller.loginUser);

// Admin
router.post('/admin/register', controller.registerAdmin);
router.post('/admin/login', controller.loginAdmin);

// Arsitek (login only)
router.post('/arsitek/login', controller.loginArsitek);

module.exports = router;
