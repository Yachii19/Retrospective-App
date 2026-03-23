const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema (
    {
        teamName: {
            type: String,
            required: [true, 'Team Name is required'],
            unique: true,
            trim: true
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Team", teamSchema);