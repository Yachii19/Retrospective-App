const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createAccessToken } = require("../middlewares/auth");
const User = require("../models/Users");
const { sendOTPEmail, sendMagicLinkEmail } = require("../services/emailService");
require("dotenv").config();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.initiateRegister = async (req, res) => {
    try {
        const required = ["username", "email", "password"];
        const missing = required.filter((f) => !req.body[f]);

        if (missing.length) {
            return res.status(400).send({
                message: "All fields are required",
                missingFields: missing
            });
        }

        const { username, email, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({ message: "Email invalid" });
        }

        if (password.length < 8) {
            return res.status(400).send({ message: "Password must be at least 8 characters" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            if (!existingEmail.isVerified) {
                const otp = generateOTP();
                existingEmail.otp = otp;
                existingEmail.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
                await existingEmail.save();
                await sendOTPEmail(email, otp);
                return res.status(200).send({
                    message: "Account pending verification. A new OTP has been sent to your email."
                });
            }
            return res.status(409).send({ message: "Email already registered" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).send({ message: "Username is already taken! Please provide another one." });
        }

        const passwordHashed = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        const newUser = new User({
            username,
            email,
            password: passwordHashed,
            isVerified: false,
            otp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
        });

        await newUser.save();
        await sendOTPEmail(email, otp);

        return res.status(201).send({
            message: "Registration initiated. Please check your email for the OTP to verify your account.",
            email
        });
    } catch (err) {
        console.error(`Registration Error: ${err}`);
        return res.status(500).send({ message: "Server error during registration" });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).send({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).send({ message: "Account is already verified" });
        }

        if (!user.otp || user.otp !== otp) {
            return res.status(400).send({ message: "Invalid OTP" });
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).send({ message: "OTP has expired. Please request a new one." });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        const token = createAccessToken(user);

        return res.status(200).send({
            message: `Welcome to Retrospect, ${user.username}!`,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(`OTP Verification Error: ${err}`);
        return res.status(500).send({ message: "Server error during OTP verification" });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).send({ message: "Account is already verified" });
        }

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendOTPEmail(email, otp);

        return res.status(200).send({ message: "A new OTP has been sent to your email." });
    } catch (err) {
        console.error(`Resend OTP Error: ${err}`);
        return res.status(500).send({ message: "Server error during OTP resend" });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            return res.status(403).send({
                message: "Please verify your email before logging in.",
                email
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).send({ message: "Invalid email or password" });
        }

        const token = createAccessToken(user);
        return res.status(200).send({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(`Login Error: ${err}`);
        return res.status(500).send({ message: "Server error during login" });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user || !user.isVerified) {
            return res.status(404).send({
                message: "No registered account found with that email address" 
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
        await sendMagicLinkEmail(email, resetLink);

        return res.status(200).send({
            message: "If that email exists, a reset link has been sent."
        });
    } catch (err) {
        console.error(`Forgot Password Error: ${err}`);
        return res.status(500).send({ message: "Server error during password reset request" });
    }
};

exports.resetPassword = async (req, res) => {
    try {

        const { email, token, newPassword } = req.body;
      
        if (!email || !token || !newPassword) {
              console.log('Reset password body:', req.body);
            return res.status(400).send({ message: "Email, token, and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).send({ message: "Password must be at least 8 characters" });
        }

        const user = await User.findOne({ email });

        if (!user || !user.resetToken || user.resetToken !== token) {
            return res.status(400).send({ message: "Invalid or expired reset link" });
        }

        if (user.resetTokenExpiry < new Date()) {
            return res.status(400).send({ message: "Reset link has expired. Please request a new one." });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).send({ message: "New password must be different from your current one" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        return res.status(200).send({ message: "Password reset successfully. You can now log in." });
    } catch (err) {
        console.error(`Reset Password Error: ${err}`);
        return res.status(500).send({ message: "Server error during password reset" });
    }
};