const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// Register new user
router.post('/register', (req, res) => {
    try {
        const user = authService.register(req.body);
        res.status(201).json({
            message: 'User registered successfully',
            data: user
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login user
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const result = authService.login(email, password);
        res.status(200).json({
            message: 'Login successful',
            data: result
        });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
});

// Check if user exists
router.get('/check/:email', (req, res) => {
    try {
        const exists = authService.userExists(req.params.email);
        res.status(200).json({
            exists,
            message: exists ? 'User exists' : 'User does not exist'
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user by ID
router.get('/user/:userId', (req, res) => {
    try {
        const user = authService.getUserById(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            message: 'User found',
            data: user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all users (admin)
router.get('/users', (req, res) => {
    try {
        const users = authService.getAllUsers();
        res.status(200).json({
            message: 'Users retrieved successfully',
            data: users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get users by team
router.get('/users/team/:teamName', (req, res) => {
    try {
        const users = authService.getUsersByTeam(req.params.teamName);
        res.status(200).json({
            message: `Users from ${req.params.teamName}`,
            data: users
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user
router.put('/user/:userId', (req, res) => {
    try {
        const user = authService.updateUser(req.params.userId, req.body);
        res.status(200).json({
            message: 'User updated successfully',
            data: user
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete user
router.delete('/user/:userId', (req, res) => {
    try {
        const result = authService.deleteUser(req.params.userId);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;