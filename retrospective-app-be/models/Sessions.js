const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
)

const sessionSchema = new mongoose.Schema(
    {
        sessionName: {
            type: String,
            required: [true, "Session name is required"],
            trim: true,
            maxlength: [100, "Session name cannot exceed 100 characters"]
        },
        team: {
            type: String,
            required: [true, "Team is required"],
            enum: ["MYS Team", "CSM Team"],
            trim: true
        },
        sections: {
            type: [sectionSchema],
            required: true
        },
        members: [
            {
                sessionMember: { 
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                joinedAt: {
                    type: Date,
                    default: Date.now
                },
                _id: false
            }
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Session", sessionSchema);