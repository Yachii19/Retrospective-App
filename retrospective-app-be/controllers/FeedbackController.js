const Feedback = require("../models/Feedbacks");
const Session = require("../models/Sessions");
const User = require("../models/Users");
const mongoose = require('mongoose');


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

        const isSessionOwner = session.createdBy.toString() === userId;

        const feedbacks = await Feedback.find({ feedbackSession: sessionId })
            .populate('feedbackPoster', 'email username')
            .populate('votedBy', 'email username');

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(404).send({
                message: "No feedbacks found",
                data: []
            });
        }

        const filteredFeedbacks = feedbacks.map(feedback => {
            const feedbackObj = feedback.toObject();
            
            feedbackObj.sections = feedbackObj.sections.map(section => {
                if (section.actionItems?.status === "Closed" && !isSessionOwner) {
                    const { actionItems, ...sectionWithoutActionItems } = section;
                    return sectionWithoutActionItems; // Return section without actionItems property
                }
                return section;
            });
            
            return feedbackObj;
        });

        res.status(200).send({
            message: `Feedbacks List:`,
            data: filteredFeedbacks
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

        const isSessionOwner = session.createdBy.toString() === userId;

        const feedbacks = await Feedback.find({ feedbackSession: sessionId, 'sections.key': sectionKey })
            .populate('feedbackPoster', 'email username')
            .populate('votedBy', 'email username');

        if (!feedbacks || feedbacks.length === 0) {
            return res.status(200).send({
                message: `No feedbacks found on section: ${sectionKey} within session: ${sessionId}`,
                data: []
            });
        }

        // Filter action items based on visibility and user permissions
        const filteredFeedbacks = feedbacks.map(feedback => {
            const feedbackObj = feedback.toObject();
            
            feedbackObj.sections = feedbackObj.sections.map(section => {
                if (section.key !== sectionKey) return section;
                
                // If status is closed and user is not session owner, remove action items
                if (section.actionItems?.status === "Closed" && !isSessionOwner) {
                    const { actionItems, ...sectionWithoutActionItems } = section;
                    return sectionWithoutActionItems; // Return section without actionItems property
                }
                
                // Otherwise show everything
                return section;
            });
            
            return feedbackObj;
        });

        res.status(200).send({
            message: `Feedbacks list for ${sectionKey}`,
            data: filteredFeedbacks
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

        return res.status(201).send({
            message: `Feedback created successfully`,
            data: populatedFeedback
        });

    } catch (err) {
        console.log(`Error adding feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when adding feedback"
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

        return res.status(200).send({
            message: "Successfully voted!",
            data: specificFeedback
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

        return res.status(200).send({
            message: "Successfully unvoted!",
            data: specificFeedback
        })
    } catch (err) {
        console.log(`Error unvoting on feedback: ${err}`);
        return res.status(500).send({
            message: "Server error when unvoting on feedback"
        });
    }
}

exports.toggleFeedbackVisibilitykById = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const { key } = req.body;
        const userId = req.user.id;

        if (!key) {
            return res.status(400).send({
                message: "Section key is required"
            });
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).send({
                message: `No Feedback with ID: ${feedbackId}`
            });
        }

        const session = await Session.findById(feedback.feedbackSession);
        if (!session) {
            return res.status(404).send({
                message: "Session not found"
            });
        }

        const isSessionOwner = session.createdBy.toString() === userId;
        if (!isSessionOwner) {
            return res.status(403).send({
                message: "Only the session owner can toggle feedback visibility"
            });
        }

        const section = feedback.sections.find(s => s.key === key);
        if (!section) {
            return res.status(404).send({
                message: `Section with key '${key}' not found in this feedback`
            });
        }

        // Fix: Changed actionItem to actionItems
        if (!section.actionItems) {
            section.actionItems = {};
        }
        
        if (section.actionItems.status === "Open") {
            section.actionItems.status = "Closed"
        } else {
            section.actionItems.status = "Open"
        }

        section.actionItems.updatedAt = Date.now();
        await feedback.save();

        return res.status(200).send({
            message: `Feedback section visibility toggled to ${section.actionItems.status}`,
            data: feedback
        });
    } catch (err) {
        console.log(`Error toggling feedback visibility: ${err}`);
        return res.status(500).send({
            message: "Server error when toggling feedback visibility"
        });
    }
}

exports.updateActionItems = async (req, res) => {
    try {
        const feedbackId = req.params.feedbackId;
        const { key, assignee, dueDate } = req.body;
        const userId = req.user.id;

        if (!key) {
            return res.status(400).send({
                message: "Section key is required"
            });
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).send({
                message: `No Feedback with ID: ${feedbackId}`
            });
        }

        const session = await Session.findById(feedback.feedbackSession);
        if (!session) {
            return res.status(404).send({
                message: "Session not found"
            });
        }

        const isSessionOwner = session.createdBy.toString() === userId;
        if (!isSessionOwner) {
            return res.status(403).send({
                message: "Only the session creator can update action items"
            });
        }

        const section = feedback.sections.find(s => s.key === key);
        if (!section) {
            return res.status(404).send({
                message: `Section with key '${key}' not found in this feedback`
            });
        }

        if (!section.actionItems) {
            section.actionItems = {
                status: "Closed",
                assignee: null,
                dueDate: null,
                updatedAt: Date.now()
            };
        }

        // Update assignee if provided
        if (assignee !== undefined) {
            section.actionItems.assignee = assignee;
        }

        // Update dueDate if provided
        if (dueDate !== undefined) {
            section.actionItems.dueDate = dueDate ? new Date(dueDate) : null;
        }

        section.actionItems.updatedAt = Date.now();
        await feedback.save();

        // Populate the feedback for response
        const populatedFeedback = await Feedback.findById(feedbackId)
            .populate('feedbackPoster', 'email username')
            .populate('votedBy', 'email username');

        return res.status(200).send({
            message: "Action items updated successfully",
            data: populatedFeedback
        });
    } catch (err) {
        console.log(`Error updating action items: ${err}`);
        return res.status(500).send({
            message: "Server error when updating action items"
        });
    }
}