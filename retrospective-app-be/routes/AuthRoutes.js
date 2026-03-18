const express = require("express");
const router = express.Router();
const authController = require('../controllers/AuthController');

router.post('/register', authController.initiateRegister);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;