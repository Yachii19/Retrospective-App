const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const feedbackService = require('../services/feedbackService');
const fileGeneratorService = require('../services/fileGeneratorService');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

router.post('/', (req, res) => {
    try {
        const session = sessionService.createSession(req.body);
        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ message: 'Error creating session', error: err.message });
    }
});

router.get('/', (req, res) => {
    try {
        const sessions = sessionService.getAllSessions();
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sessions', error: err.message });
    }
});

router.get('/:sessionId', (req, res) => {
    try {
        const session = sessionService.getSessionById(req.params.sessionId);
        res.status(201).send({
            message: `Session with ID: ${req.params.sessionId}`,
            data: session
        })
    } catch (err) {
        res.status(500).json({ message: 'Error fetching session', error: err.message });
    }
})

router.post('/:id/feedback', (req, res) => {
    try {
        feedbackService.addFeedback(req.params.id, req.body);
        res.status(201).json({ message: 'Feedback added' });
    } catch (err) {
        res.status(500).json({ message: 'Error adding feedback', error: err.message });
    }
});

router.get('/:id/feedback', (req, res) => {
    try {
        const feedback = feedbackService.getFeedbackBySessionId(req.params.id);
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedback', error: err.message });
    }
});

router.get('/feedback/user/:username', (req, res) => {
    try {
        const username = req.params.username;
        const feedbackData = feedbackService.getFeedbackByUser(username);
        res.status(200).send({
            message: `Feedback of user: ${username}`,
            data: feedbackData
        })
    } catch (err) {
        res.status(500).json({ message: 'Error fetching feedback', error: err.message });
    }
})

router.post('/:id/generate', (req, res) => {
    try {
        const fileName = fileGeneratorService.generateSessionTextFile(parseInt(req.params.id));
        res.status(200).json({ message: 'File generated successfully', fileName });
    } catch (err) {
        res.status(500).json({ message: 'Error generating file', error: err.message });
    }
});

router.get('/sessions/:id/download', (req, res) => {
    try {
        const sessionId = req.params.id;
        const fileName = fileGeneratorService.generateSessionTextFile(sessionId);
        const filePath = path.join(config.outputFolder, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.download(filePath, fileName);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
});

module.exports = router;