const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const fileGeneratorService = require('../services/fileGeneratorService');

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
        res.status(200).send({
            message: `All Sessions List: `,
            data: sessions
        })
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sessions', error: err.message });
    }
});

router.get('/:sessionId', (req, res) => {
    try {
        const session = sessionService.getSessionById(req.params.sessionId);
        res.status(200).send({
            message: `Session with ID: ${req.params.sessionId}`,
            data: session
        })
    } catch (err) {
        res.status(500).json({ message: 'Error fetching session', error: err.message });
    }
})

router.get('/team/:teamName', (req, res) => {
    try {
        const { teamName } = req.params;
        const sessions = sessionService.getSessionsByTeam(teamName);
        res.status(200).json({
            message: `Sessions for team: ${teamName}`,
            data: sessions
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sessions by team', error: err.message });
    }
});

// Join a session
router.post('/:sessionId/join', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { email, username } = req.body;

        if (!email || !username) {
            return res.status(400).json({ message: 'Email and username are required' });
        }

        const session = sessionService.joinSession(sessionId, email, username);
        res.status(200).json({
            message: 'Successfully joined session',
            data: session
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Leave a session
router.post('/:sessionId/leave', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const session = sessionService.leaveSession(sessionId, email);
        res.status(200).json({
            message: 'Successfully left session',
            data: session
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get session members
router.get('/:sessionId/members', (req, res) => {
    try {
        const members = sessionService.getSessionMembers(req.params.sessionId);
        res.status(200).json({
            message: 'Session members retrieved',
            data: members
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's sessions
router.get('/user/:email/sessions', (req, res) => {
    try {
        const sessions = sessionService.getUserSessions(req.params.email);
        res.status(200).json({
            message: 'User sessions retrieved',
            data: sessions
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/generate', (req, res) => {
    try {
        const fileName = fileGeneratorService.generateSessionTextFile(parseInt(req.params.id));
        res.status(200).json({ message: 'File generated successfully', fileName });
    } catch (err) {
        res.status(500).json({ message: 'Error generating file', error: err.message });
    }
});

module.exports = router;