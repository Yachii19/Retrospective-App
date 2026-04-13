const mongoose = require("mongoose");

const feedbackSectionSchema = new mongoose.Schema(
    {
        key: String,
        title: String,
        items: [String]
    },
    {
        _id: false
    }
)

const feedbackSchema = new mongoose.Schema(
    {
        feedbackSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            required: true
        },
        feedbackPoster: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        sections: [feedbackSectionSchema],
        votes: {
            type: Number,
            default: 0
        },
        votedBy: [ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }  
        ]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Feedback", feedbackSchema)