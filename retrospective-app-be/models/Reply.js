const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema(
    {    
        feedback: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Feedback",
            required: true
        },
        content: {
            type: String,
            required: [true, "Reply content is required!"],
            trim: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        tiemstamps: true
    }
)


module.exports = mongoose.model("Reply", ReplySchema)