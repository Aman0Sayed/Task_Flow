const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Use controller for register and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/verify', protect, authController.getMe);

module.exports = router;