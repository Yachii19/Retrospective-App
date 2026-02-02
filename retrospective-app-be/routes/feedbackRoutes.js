const express = require('express');
const router = express.Router();
const feedbackService = require('../services/feedbackService');
const sessionService = require('../services/sessionService');

// Add feedback to session
router.post('/:id', (req, res) => {
    try {
        const feedback = feedbackService.addFeedback(req.params.id, req.body);
        res.status(201).json({ message: 'Feedback added', data: feedback });
    } catch (err) {
        res.status(500).json({ message: 'Error adding feedback', error: err.message });
    }
});

// Get session feedback
router.get('/:id', (req, res) => {
    try {
        const feedback = feedbackService.getFeedbackBySessionId(req.params.id);
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedback', error: err.message });
    }
});

// Get feedback by section
router.get('/:id/section/:sectionKey', (req, res) => {
    try {
        const { id, sectionKey } = req.params;
        const feedback = feedbackService.getFeedbackBySessionAndSection(id, sectionKey);
        res.status(200).json({
            message: `Feedback for section: ${sectionKey}`,
            data: feedback
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedback by section', error: err.message });
    }
});

// Vote feedback
router.post('/:feedbackId/vote', (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        const feedback = feedbackService.voteFeedback(feedbackId, username);
        res.status(200).json({ 
            message: 'Vote added successfully', 
            data: feedback 
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Unvote feedback
router.delete('/:feedbackId/vote/:username', (req, res) => {
    try {
        const { feedbackId, username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        const feedback = feedbackService.unvoteFeedback(feedbackId, username);
        res.status(200).json({ 
            message: 'Vote removed successfully', 
            data: feedback 
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle action item status (session creator only)
router.post('/:feedbackId/section/:sectionKey/action-item/toggle', (req, res) => {
    try {
        const { feedbackId, sectionKey } = req.params;
        const { status, userEmail } = req.body;
        
        if (!status || !userEmail) {
            return res.status(400).json({ message: 'Status and userEmail are required' });
        }
        
        // Get feedback by feedbackId (fixed logic)
        const feedback = feedbackService.getFeedbackById(feedbackId);
        
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        
        // Verify user is session creator
        const session = sessionService.getSessionById(feedback.sessionId);
        if (!session || session.createdBy !== userEmail) {
            return res.status(403).json({ message: 'Only session creator can toggle action item status' });
        }
        
        const updatedFeedback = feedbackService.toggleActionItemStatus(feedbackId, sectionKey, status);
        res.status(200).json({
            message: `Action item ${status.toLowerCase()}`,
            data: updatedFeedback
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update action item
router.put('/:feedbackId/section/:sectionKey/action-item', (req, res) => {
    try {
        const { feedbackId, sectionKey } = req.params;
        const updateData = req.body;
        
        const feedback = feedbackService.updateActionItem(feedbackId, sectionKey, updateData);
        res.status(200).json({
            message: 'Action item updated successfully',
            data: feedback
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all action items for session (creator only)
router.get('/session/:sessionId/action-items', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userEmail } = req.query;
        
        // Verify user is session creator
        const session = sessionService.getSessionById(sessionId);
        if (!session || session.createdBy !== userEmail) {
            return res.status(403).json({ message: 'Only session creator can view all action items' });
        }
        
        const actionItems = feedbackService.getSessionActionItems(sessionId);
        res.status(200).json({
            message: 'Action items retrieved',
            data: actionItems
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get feedback by user
router.get('/user/:email', (req, res) => {
    try {
        const email = req.params.email;
        const feedbackData = feedbackService.getFeedbackByUser(email);
        res.status(200).send({
            message: `Feedback of user: ${email}`,
            data: feedbackData
        })
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedback', error: err.message });
    }
});

module.exports = router;