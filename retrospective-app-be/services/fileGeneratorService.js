const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const sessionService = require('./sessionService');
const feedbackService = require('./feedbackService');

class FileGeneratorService {
    generateSessionTextFile(sessionId) {
        const session = sessionService.getSessionById(sessionId);
        const feedback = feedbackService.getFeedbackBySessionId(sessionId);
        
        let content = `Retrospective Session: ${session.name}\n`;
        content += `Description: ${session.description}\n`;
        content += `Date: ${new Date(session.createdAt).toLocaleDateString()}\n\n`;
        content += `${'='.repeat(60)}\n\n`;
        
        // Sort feedback by votes (highest first)
        feedback.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        
        feedback.forEach((fb, index) => {
            content += `Feedback #${index + 1} - ${fb.username}\n`;
            content += `Votes: ${fb.votes || 0}\n`;
            content += `${'-'.repeat(60)}\n`;
            
            if (fb.sections) {
                fb.sections.forEach(section => {
                    content += `\n${section.title}:\n`;
                    if (section.items && section.items.length > 0) {
                        section.items.forEach(item => {
                            content += `  - ${item}\n`;
                        });
                    } else {
                        content += `  (No items)\n`;
                    }
                });
            }
            
            content += `\n${'='.repeat(60)}\n\n`;
        });
        
        const fileName = `${session.name.replace(/\s+/g, '_')}_Feedback.txt`;
        fs.writeFileSync(path.join(config.outputFolder, fileName), content);

        return fileName;
    }
}

module.exports = new FileGeneratorService();