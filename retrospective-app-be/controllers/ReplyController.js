const Reply = require('../models/Reply');
const Feedback = require("../models/Feedbacks");

exports.createReplyByFeedbackId = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const specificFeedback = await Feedback.findById(feedbackId);
        if (!specificFeedback) {
            return res.status(404).send({ 
                message: "Feedback not found!" 
            });
        }

        const content = req.body.content;
        if (!content) {
            return res.status(400).send({ 
                message: "Reply content is required!" 
            });
        }

        const userId = req.user.id;

        const newReply = new Reply ({
            feedback: feedbackId,
            content: content,
            createdBy: userId
        });

        const savedReply = await newReply.save();

        res.status(201).send({
            message: "Reply created successfully!",
            data: savedReply
        })
    } catch (err) {
        console.log(`Error adding reply: ${err}`);
        return res.status(500).send({
            message: "Server error when adding reply"
        });
    }
}

exports.getAllRepliesByFeedbackId = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const specificFeedback = await Feedback.findById(feedbackId);
        if (!specificFeedback) {
            return res.status(404).send({ 
                message: "Feedback not found!" 
            });
        }

        const replies = await Reply.find({ feedback: feedbackId }).populate("createdBy", "username");

        res.status(200).send({
            message: "Replies retrieved successfully!",
            data: replies
        });
    } catch (err) {
        console.log(`Error fetching replies: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching replies"
        });
    }
}