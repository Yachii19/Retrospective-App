const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const sessionService = require('./sessionService');
const feedbackService = require('./feedbackService');

class FileGeneratorService {
    generateSessionTextFile(sessionId) {
        const session = sessionService.getSessionById(sessionId);
        if (!session) throw new Error('Session not found');

        const feedbackList = feedbackService.getFeedbackBySessionId(sessionId);

        console.log(feedbackList);

        let textContent = `Sprint: ${session.sessionName}\nTeam: ${session.team}\nDate: ${session.createdAt}\n==============================\n\n`;

        feedbackList.forEach(fb => {
            textContent += `User: ${fb.username}\nTime: ${fb.time}\n\n`;

            textContent += `[WENT WELL]\n`;
            fb.wentWell.forEach(item => { textContent += `- ${item}\n`; });

            textContent += `\n[NEEDS IMPROVEMENT]\n`;
            fb.needsImprovement.forEach(item => { textContent += `- ${item}\n`; });

            textContent += `\n[ACTION ITEMS]\n`;
            fb.actionItems.forEach(item => { textContent += `- ${item}\n`; });

            textContent += `\n------------------------------\n\n`;
        });

        const fileName = `${session.sessionName.replace(/\s+/g, '_')}_Feedback.txt`;
        fs.writeFileSync(path.join(config.outputFolder, fileName), textContent);

        return fileName;
    }
}

module.exports = new FileGeneratorService();