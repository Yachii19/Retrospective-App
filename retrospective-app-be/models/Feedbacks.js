const mongoose = require("mongoose");

const actionItemSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["Open", "Closed"],
            default: "Closed"
        },
        assignee: {
            type: String,
            default: null
        },
        dueDate: {
            type: Date,
            default: null
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
)

const feedbackSectionSchema = new mongoose.Schema(
    {
        key: String,
        title: String,
        items: [String],
        actionItems: {
            type: actionItemSchema,
            default: () => ({})
        }
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