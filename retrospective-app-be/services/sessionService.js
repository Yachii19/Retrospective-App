const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const sessionsFile = path.join(config.dataFolder, config.sessionsFile);

class SessionService {
    createSession(sessionData) {

        const validTeams = ['MYS Team', 'CSM Team'];
        if (!sessionData.team || !validTeams.includes(sessionData.team)) {
            throw new Error('Invalid team. Must be either "MYS Team" or "CSM Team"');
        }

        const session = {
            sessionId: Date.now(),
            sessionName: sessionData.sessionName,
            team: sessionData.team,
            sections: sessionData.sections || [
                { key: 'went-well', title: 'Went Well' },
                { key: 'needs-improvement', title: 'Needs Improvement' }
            ],
            members: sessionData.members || [],
            createdBy: sessionData.createdBy || null,
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
        const numericSessionId = parseInt(sessionId);
        console.log(sessions.find(s => s.sessionId == numericSessionId));
        return sessions.find(s => s.sessionId == numericSessionId);
    }

    getSessionsByTeam(team) {
        const sessions = this.getAllSessions();
        return sessions.filter(s => s.team === team);
    }

    joinSession(sessionId, userEmail, username) {
        if (!fs.existsSync(sessionsFile)) {
            throw new Error('Sessions file not found');
        }

        const sessions = fs.readFileSync(sessionsFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        // Convert sessionId to number for comparison
        const numericSessionId = parseInt(sessionId);
        const sessionIndex = sessions.findIndex(s => s.sessionId === numericSessionId);
        console.log(sessionIndex);
        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }

        const session = sessions[sessionIndex];

        if (!session.members) {
            session.members = [];
        }

        const alreadyJoined = session.members.some(m => m.email === userEmail);
        if (alreadyJoined) {
            throw new Error('User already joined this session');
        }

        session.members.push({
            email: userEmail,
            username: username,
            joinedAt: new Date().toISOString()
        });

        const updatedContent = sessions.map(s => JSON.stringify(s)).join('\n') + '\n';
        fs.writeFileSync(sessionsFile, updatedContent);

        return session;
    }

    leaveSession(sessionId, userEmail) {
        if (!fs.existsSync(sessionsFile)) {
            throw new Error('Sessions file not found');
        }

        const sessions = fs.readFileSync(sessionsFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        // Convert sessionId to number for comparison
        const numericSessionId = parseInt(sessionId);
        const sessionIndex = sessions.findIndex(s => s.sessionId === numericSessionId);
        
        if (sessionIndex === -1) {
            throw new Error('Session not found');
        }

        const session = sessions[sessionIndex];

        if (!session.members) {
            throw new Error('No members in this session');
        }

        const initialLength = session.members.length;
        session.members = session.members.filter(m => m.email !== userEmail);

        if (session.members.length === initialLength) {
            throw new Error('User is not a member of this session');
        }

        const updatedContent = sessions.map(s => JSON.stringify(s)).join('\n') + '\n';
        fs.writeFileSync(sessionsFile, updatedContent);

        return session;
    }

    getSessionMembers(sessionId) {
        const session = this.getSessionById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        return session.members || [];
    }

    getUserSessions(userEmail) {
        const sessions = this.getAllSessions();
        return sessions.filter(s => 
            s.members && s.members.some(m => m.email === userEmail)
        );
    }
}

module.exports = new SessionService();