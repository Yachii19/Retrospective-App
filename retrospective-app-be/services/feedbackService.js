const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const feedbackFile = path.join(config.dataFolder, config.feedbackFile);

class FeedbackService {
    addFeedback(sessionId, feedbackData) {
        const feedback = { 
            sessionId,
            username: feedbackData.username,
            wentWell: feedbackData.wentWell,
            needsImprovement: feedbackData.needsImprovement,
            actionItems: feedbackData.actionItems,
            createdAt: new Date().toISOString()
        };
        fs.appendFileSync(feedbackFile, JSON.stringify(feedback) + '\n');
        return feedback;
    }

    getFeedbackBySessionId(sessionId) {
        if (!fs.existsSync(feedbackFile)) return [];
        return fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line))
            .filter(f => f.sessionId == sessionId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
    }

    getFeedbackByUser(username) {
        if (!fs.existsSync(feedbackFile)) return [];
        return fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(f => f && f.username === username)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
    }
}

module.exports = new FeedbackService();