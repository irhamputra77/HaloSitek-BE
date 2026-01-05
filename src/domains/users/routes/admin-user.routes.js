// src/domains/users/routes/admin-user.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../../../middlewares/auth.middleware');
const { upload } = require('../../../middlewares/upload.middleware');
const adminUserController = require('../controllers/admin-user.controller');

// single upload utk foto profil admin-side juga
const uploadProfilePicture = upload.single('profilePicture');

// /api/admin/users
router.get('/', authMiddleware.verifyAdmin, adminUserController.list);
router.get('/:id', authMiddleware.verifyAdmin, adminUserController.detail);
router.post('/', authMiddleware.verifyAdmin, uploadProfilePicture, adminUserController.create);
router.put('/:id', authMiddleware.verifyAdmin, uploadProfilePicture, adminUserController.update);
router.delete('/:id', authMiddleware.verifyAdmin, adminUserController.remove);

module.exports = router;
