// src/domains/admins/routes/admin-auth.routes.js
const express = require('express');
const controller = require('../controllers/admin-auth.controller');

const router = express.Router();

// /admins/register, /admins/login (jika nanti di-mount di app.js)
router.post('/register', controller.registerAdmin);
router.post('/login', controller.loginAdmin);

module.exports = router;
