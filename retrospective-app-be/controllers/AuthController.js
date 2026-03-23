const bcrypt = require("bcrypt");
const { createAccessToken } = require("../middlewares/auth");
const User = require("../models/Users");
require("dotenv").config();

exports.registerUser = async (req, res) => {
    try {
        const required = ["username", "email", "password", "recoveryPin"];
        const missing = required.filter((f) => !req.body[f]);

        if (missing.length) {
            return res.status(400).send({
                message: "All fields are required",
                missingFields: missing
            });
        }

        const { username, email, password, recoveryPin } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({ message: "Email invalid" });
        }

        if (password.length < 8) {
            return res.status(400).send({ message: "Password must be at least 8 characters" });
        }

        if (!/^\d{6}$/.test(recoveryPin)) {
            return res.status(400).send({ message: "Recovery PIN must be exactly 6 digits" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).send({ message: "Email already registered" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).send({ message: "Username is already taken! Please provide another one." });
        }

        const passwordHashed = await bcrypt.hash(password, 10);
        const pinHashed = await bcrypt.hash(recoveryPin, 10);

        const newUser = new User({
            username,
            email,
            password: passwordHashed,
            recoveryPin: pinHashed,
            isVerified: true
        });

        await newUser.save();

        const token = createAccessToken(newUser);

        return res.status(201).send({
            message: "Registration successful!",
            token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            }
        });
    } catch (err) {
        console.error(`Registration Error: ${err}`);
        return res.status(500).send({ message: "Server error during registration" });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: "Invalid email or password" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).send({ message: "Invalid email or password" });
        }

        const token = createAccessToken(user);

        return res.status(200).send({
            message: "Login successful",
            token,
            requiresPinSetup: !user.recoveryPin, // ← flags existing users with no PIN
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(`Login Error: ${err}`);
        return res.status(500).send({ message: "Server error during login" });
    }
};

exports.setupPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const userId = req.user.id;

        if (!pin) {
            return res.status(400).send({ message: "PIN is required" });
        }

        if (!/^\d{6}$/.test(pin)) {
            return res.status(400).send({ message: "PIN must be exactly 6 digits" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (user.recoveryPin) {
            return res.status(400).send({ message: "PIN already set" });
        }

        user.recoveryPin = await bcrypt.hash(pin, 10);
        await user.save();

        return res.status(200).send({ message: "Recovery PIN set successfully" });
    } catch (err) {
        console.error(`Setup PIN Error: ${err}`);
        return res.status(500).send({ message: "Server error during PIN setup" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, recoveryPin, newPassword, confirmPassword } = req.body;

        if (!email || !recoveryPin || !newPassword || !confirmPassword) {
            return res.status(400).send({ message: "All fields are required" });
        }

        if (!/^\d{6}$/.test(recoveryPin)) {
            return res.status(400).send({ message: "Recovery PIN must be exactly 6 digits" });
        }

        if (newPassword.length < 8) {
            return res.status(400).send({ message: "New password must be at least 8 characters" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).send({ message: "Passwords do not match" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send({ message: "No account found with that email" });
        }

        if (!user.recoveryPin) {
            return res.status(400).send({ message: "No recovery PIN set for this account" });
        }

        const isPinCorrect = await bcrypt.compare(recoveryPin, user.recoveryPin);
        if (!isPinCorrect) {
            return res.status(401).send({ message: "Incorrect recovery PIN" });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).send({ message: "New password must be different from current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return res.status(200).send({ message: "Password reset successfully" });
    } catch (err) {
        console.error(`Reset Password Error: ${err}`);
        return res.status(500).send({ message: "Server error during password reset" });
    }
};