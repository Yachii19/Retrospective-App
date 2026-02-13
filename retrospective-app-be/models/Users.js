const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
            maxlength: [50, "Username cannot exceed 50 characters"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            maxlength: [100, "Email cannot exceed 100 characters"],
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            default: null
        }
    }, 
    {
        timestamps: true
    }
)

module.exports = mongoose.model("User", userSchema);