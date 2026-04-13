const Reply = require('../models/Reply');
const Feedback = require("../models/Feedbacks");
const { getIO } = require("../socket");

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

        const populatedReply = await Reply.findById(savedReply._id)
        .populate('createdBy', 'username email');

        try {
            getIO().to(specificFeedback.feedbackSession.toString()).emit("reply:created", {
                message: "A new reply has been added!",
                data: populatedReply
            });
        } catch (socketErr) {
            console.warn("Socket emit failed (reply:created):", socketErr.message);
        }

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

exports.updateReplyById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { replyId } = req.params;
        const { newReply, content } = req.body;

        const trimmedReply = typeof newReply === "string"
            ? newReply.trim()
            : (typeof content === "string" ? content.trim() : "");

        if (!trimmedReply) {
            return res.status(400).send({
                message: "New reply field input is required!"
            });
        }

        const specificReply = await Reply.findById(replyId);
        if (!specificReply) {
            return res.status(404).send({
                message: `No reply found with the ID: ${replyId}`
            });
        }

        const isPoster = specificReply.createdBy.toString() === userId;
        if (!isPoster) {
            return res.status(403).send({
                message: "Unauthorized: You can't edit replies that you didn't make."
            });
        }

        specificReply.content = trimmedReply;
        await specificReply.save();

        const updatedReply = await Reply.findById(replyId)
            .populate("createdBy", "username email");

        const relatedFeedback = await Feedback.findById(specificReply.feedback);
        if (relatedFeedback) {
            try {
                getIO().to(relatedFeedback.feedbackSession.toString()).emit("reply:updated", {
                    message: "Reply updated successfully",
                    data: updatedReply
                });
            } catch (socketErr) {
                console.warn("Socket emit failed (reply:updated):", socketErr.message);
            }
        }

        return res.status(200).send({
            message: "Reply successfully updated!",
            data: updatedReply
        });
    } catch (err) {
        console.log(`Error updating reply: ${err}`);
        return res.status(500).send({
            message: "Server error when updating reply"
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

        const replies = await Reply.find({ feedback: feedbackId }).populate("createdBy", "username email");

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