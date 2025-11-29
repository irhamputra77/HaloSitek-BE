// src/domains/users/routes/user-auth.routes.js
const express = require('express');
const controller = require('../controllers/user-auth.controller');

const router = express.Router();

// /users/register, /users/login (jika nanti di-mount di app.js)
router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser);

module.exports = router;
