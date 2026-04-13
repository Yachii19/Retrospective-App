const Feedback = require("../models/Feedbacks");
const Session = require("../models/Sessions");
const User = require("../models/Users");
const mongoose = require('mongoose');
const { getIO } = require("../socket");

exports.getFeedbackBySessionId = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).send({
                message: "User not authenticated"
            });
        }
        
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).send({
                message: "Session not found"
            });
        }

        const feedbacks = await Feedback.find({ feedbackSession: sessionId })
            .populate('feedbackPoster', 'email username')
            .populate('votedBy', 'email username');

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(404).send({
                message: "No feedbacks found",
                data: []
            });
        }

        res.status(200).send({
            message: `Feedbacks List:`,
            data: feedbacks
        });
    } catch (err) {
        console.log(`Error fetching session feedbacks: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions feedbacks"
        });
    }
}

exports.getFeedbackBySessionAndSection = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const sectionKey = req.params.sectionKey;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).send({
                message: "User not authenticated"
            });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).send({
                message: "Session not found"
            });
        }
        
        const feedbacks = await Feedback.find({ feedbackSession: sessionId, 'sections.key': sectionKey })
            .populate('feedbackPoster', 'email username')
            .populate('votedBy', 'email username');

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(200).send({
                message: `No feedbacks found on section: ${sectionKey} within session: ${sessionId}`,
                data: []
            });
        }

        res.status(200).send({
            message: `Feedbacks list for ${sectionKey}`,
            data: feedbacks
        });
    } catch (err) {
        console.log(`Error fetching session feedbacks: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions feedbacks"
        });
    }
}

exports.getFeedbackByUserAndSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).send({
                message: "User not found"
            });
        }

        const userFeedbacks = await Feedback.aggregate([
            {
                $match: { 
                    feedbackPoster: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'sessions',
                    localField: 'feedbackSession',
                    foreignField: '_id',
                    as: 'sessionDetails'
                }
            },
            {
                $unwind: '$sessionDetails'
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'feedbackPoster',
                    foreignField: '_id',
                    as: 'posterDetails'
                }
            },
            {
                $unwind: '$posterDetails'
            },
            {
                $addFields: {
                    feedbackSession: {
                        _id: '$sessionDetails._id',
                        sessionName: '$sessionDetails.sessionName',
                        team: '$sessionDetails.team'
                    },
                    feedbackPoster: {
                        _id: '$posterDetails._id',
                        username: '$posterDetails.username',
                        email: '$posterDetails.email'
                    }
                }
            },
            {
                $group: {
                    _id: "$feedbackSession._id",
                    sessionName: { $first: "$feedbackSession.sessionName" },
                    team: { $first: "$feedbackSession.team" },
                    feedbacks: { 
                        $push: {
                            _id: "$_id",
                            feedbackSession: "$feedbackSession",
                            feedbackPoster: "$feedbackPoster",
                            sections: "$sections",
                            votes: "$votes",
                            votedBy: "$votedBy",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            __v: "$__v"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    sessionName: 1,
                    team: 1,
                    feedbacks: 1
                }
            }
        ]);

        if (!userFeedbacks || userFeedbacks.length === 0) {
            return res.status(404).send({
                message: `No feedbacks found for ${user.username}`,
                data: []
            });
        }

        return res.status(200).send({
            message: `Feedback list for user ${user.username}`,
            data: userFeedbacks
        });
    } catch (err) {
        console.log(`Error fetching session feedbacks: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions feedbacks"
        });
    }
}


exports.filterFeedbacksByMember = async (req, res) => {
    try {
        const {sessionId, memberId} = req.params;
        const session = await Session.findById(sessionId);
        
        if (!session) {
            return res.status(404).send({
                message: `Session with ID: ${sessionId} not found!`
            });
        }

        const isMemberIncluded = session.members.some(
            member => member.sessionMember._id.toString() === memberId
        );

        if(!isMemberIncluded) {
            return res.status(404).send({
                message: `Member ID: ${memberId} isn't included in the session`
            });
        }

        const filteredFeedbacks = await Feedback.find({
            feedbackSession: sessionId,
            feedbackPoster: memberId
        })
        .populate('feedbackPoster', 'email username')
        .populate('votedBy', 'email username');

        if (!filteredFeedbacks || filteredFeedbacks.length === 0) {
            return res.status(200).send({
                message: `Member has no feedback`,
                data: []
            });
        }

        res.status(200).send({
            message: `Filtered feedbacks list:`,
            data: filteredFeedbacks
        })
    } catch (err) {
        console.log(`Error fetching filtered feedbacks: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching filtered feedacks"
        });
    }
}

exports.addFeedbackBySection = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.user.id;
        const {
            sectionKey,
            feedbackText
        } = req.body;

        if (!sectionKey || !feedbackText) {
            return res.status(400).send({
                message: "Section key and feedback text are required",
                missingFields: !sectionKey ? ['sectionKey'] : ['feedbackText']
            });
        }

        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).send({
                message: `Session with ID: ${sessionId} not found!`
            });
        }

        const isMember = session.members.some(member => 
            member.sessionMember.toString() === userId
        );

        if (!isMember) {
            return res.status(403).send({
                message: "User cannot add feedback for sessions not joined!"
            });
        }

        const section = session.sections.find(s => s.key === sectionKey);
        if (!section) {
            return res.status(400).send({
                message: `Section with key '${sectionKey}' does not exist in this session`
            });
        }

        const newFeedback = new Feedback({
            feedbackSession: sessionId,
            feedbackPoster: userId,
            sections: [
                {
                    key: sectionKey,
                    title: section.title,
                    items: [feedbackText]
                }
            ]
        });

        await newFeedback.save();

        const populatedFeedback = await Feedback.findById(newFeedback._id)
            .populate('feedbackPoster', 'username email');

        getIO().to(sessionId).emit("feedback:added", {
            sectionKey,
            feedback: populatedFeedback
        });

        return res.status(201).send({
            message: "Feedback created successfully",
            data: populatedFeedback
        });

    } catch (err) {
        console.log(`Error adding feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when adding feedback"
        });
    }
}

exports.updateFeedbackById = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const userId = req.user.id;
        const { newFeedback } = req.body;

        const updatedText = (newFeedback).trim();

        if (!updatedText) {
            return res.status(400).send({
                message: "Feedback text is required",
            });
        }

        const specificFeedback = await Feedback.findById(feedbackId);
        if (!specificFeedback) {
            return res.status(404).send({
                message: `No Feedback found with the ID: ${feedbackId}`
            });
        }

        const isPoster = specificFeedback.feedbackPoster.toString() === userId;
        if (!isPoster) {
            return res.status(403).send({
                message: `Unauthorized: You can't edit feedbacks that you didn't post.`
            });
        }

        const editableSection = specificFeedback.sections.find(
            section => Array.isArray(section.items) && section.items.length > 0
        );

        if (!editableSection) {
            return res.status(400).send({
                message: "Feedback has no editable content"
            });
        }

        editableSection.items[0] = updatedText;
        await specificFeedback.save();

        const updatedFeedback = await Feedback.findById(specificFeedback._id)
            .populate('feedbackPoster', 'username email');

        getIO().to(updatedFeedback.feedbackSession.toString()).emit("feedback:updated", {
            feedback: updatedFeedback
        });

        return res.status(200).send({
            message: `Feedback updated successfully`,
            data: updatedFeedback
        })
    } catch (err) {
        console.log(`Error updating feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when updating feedback"
        });
    }
}

exports.voteByFeedbackId = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const userId = req.user.id;

        const specificFeedback = await Feedback.findById(feedbackId);
        if (!specificFeedback) {
            return res.status(404).send({
                message: `No Feedback with ID: ${feedbackId}`,
            })
        }

        const hasVoted = specificFeedback.votedBy.some(voterId => 
            voterId.toString() === userId
        );

        if (hasVoted) {
            return res.status(409).send({
                message: "You already voted! Cannot vote multiple times"
            })
        }
        
        specificFeedback.votedBy.push(userId);
        specificFeedback.votes += 1;

        await specificFeedback.save();
        const populatedFeedback = await Feedback.findById(feedbackId)
            .populate('votedBy', 'username email');
        try {
            getIO().to(populatedFeedback.feedbackSession.toString()).emit("feedback:voted", {
                feedbackId: populatedFeedback._id,
                votes: populatedFeedback.votes,
                votedBy: populatedFeedback.votedBy
            });
        } catch (socketErr) {
            console.warn("Socket emit failed (feedback:voted):", socketErr.message);
        }
        return res.status(200).send({
            message: "Successfully voted!",
            data: populatedFeedback
        })

    } catch (err) {
        console.log(`Error voting on feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when voting on feedback"
        });
    }
}

exports.unvoteByFeedbackId = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const userId = req.user.id;

        const specificFeedback = await Feedback.findById(feedbackId);
        if (!specificFeedback) {
            return res.status(404).send({
                message: `No Feedback with ID: ${feedbackId}`,
            })
        }

        const hasVoted = specificFeedback.votedBy.some(voterId => 
            voterId.toString() === userId
        );

        if (!hasVoted) {
            return res.status(409).send({
                message: "Unable to unvote! You haven't voted yet."
            });
        }

         await Feedback.updateOne(
            {_id: feedbackId },
            { $pull: {votedBy: userId} }
        );

        specificFeedback.votes -= 1;

        await specificFeedback.save();

        const populatedFeedback = await Feedback.findById(feedbackId)
            .populate('votedBy', 'username email');

        try {
            getIO().to(populatedFeedback.feedbackSession.toString()).emit("feedback:voted", {
                feedbackId: populatedFeedback._id,
                votes: populatedFeedback.votes,
                votedBy: populatedFeedback.votedBy
            });
        } catch (socketErr) {
            console.warn("Socket emit failed (feedback:voted):", socketErr.message);
        }

        return res.status(200).send({
            message: "Successfully unvoted!",
            data: populatedFeedback
        })
    } catch (err) {
        console.log(`Error unvoting on feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when unvoting on feedback"
        });
    }
}