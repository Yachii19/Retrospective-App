const express = require("express");
const router = express.Router();
const authController = require('../controllers/AuthController');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/setup-pin', verifyToken, authController.setupPin);
router.post('/reset-password', authController.resetPassword);

module.exports = router;