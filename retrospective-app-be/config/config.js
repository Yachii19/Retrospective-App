const path = require('path');

module.exports = {
    port: 3000,
    corsOrigins: ['http://localhost:4200'],
    dataFolder: path.join(__dirname, '..', 'data'),
    outputFolder: path.join(__dirname, '..', 'output'),
    sessionsFile: 'sessions.txt',
    feedbackFile: 'feedback.txt'
};