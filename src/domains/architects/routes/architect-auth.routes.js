// src/domains/architects/routes/architect-auth.routes.js
const express = require('express');
const controller = require('../controllers/architect-auth.controller');

const router = express.Router();

// /architects/login (jika nanti di-mount di app.js)
router.post('/login', controller.loginArsitek);

module.exports = router;
