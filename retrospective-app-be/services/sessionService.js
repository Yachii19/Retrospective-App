const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const sessionsFile = path.join(config.dataFolder, config.sessionsFile);

class SessionService {
    createSession(sessionData) {
        const sessions = this.getAllSessions();
        const newId = sessions.length ? Math.max(...sessions.map(s => s.sessionId)) + 1 : 1;

        const session = {
            sessionId: newId,
            sessionName: sessionData.sessionName,
            team: sessionData.team,
            createdAt: new Date().toISOString()
        };

        fs.appendFileSync(sessionsFile, JSON.stringify(session) + '\n');
        return session;
    }

    getAllSessions() {
        if (!fs.existsSync(sessionsFile)) return [];
        return fs.readFileSync(sessionsFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));
    }

    getSessionById(sessionId) {
        const sessions = this.getAllSessions();
        return sessions.find(s => s.sessionId == sessionId);
    }
}

module.exports = new SessionService();