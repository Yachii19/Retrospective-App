const User = require("../models/Users.js");
const bcrypt = require("bcryptjs");

exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
};

exports.changeUsername = async (req, res) => {
    try {
        const userId = req.user.id;
        const newUsername = req.body.username;

        if (!newUsername || newUsername.trim() === "") {
            return res.status(400).send({
                message: "Username cannot be empty"
            });
        }

        const usernameExists = await User.findOne({
            username: newUsername,
        });
        if (usernameExists) {
            return res.status(400).send({
                message: "Username already exists. Please choose a different one."
            });
        }

        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(400).send({
                message: `Invalid user!`
            })
        }

        existingUser.username = newUsername;
        await existingUser.save();

        res.status(200).json({
            success: true,
            message: "Username updated successfully",
            username: newUsername
        });
    } catch (error) {
        console.error("Error changing username:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const newPassword = req.body.password;

        if (!newPassword || newPassword.trim() === "") {
            return res.status(400).send({
                message: "Password cannot be empty"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).send({
                message: "Password must be at least 8 characters long"
            });
        }

        const existingUser = await User.findById(userId);
        const existingUserPassword = existingUser.password;
        if (bcrypt.compareSync(newPassword, existingUserPassword)) {
            return res.status(400).send({
                message: `Password must be different to your current one!`
            })
        }

        if (!existingUser) {
            return res.status(400).send({
                message: `Invalid user!`
            })
        }

        existingUser.password = await bcrypt.hash(newPassword, 10);
        await existingUser.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}