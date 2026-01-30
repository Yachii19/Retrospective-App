const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const sessionService = require('./sessionService');

const feedbackFile = path.join(config.dataFolder, config.feedbackFile);

class FeedbackService {
    addFeedback(sessionId, feedbackData) {
        // Get session to retrieve sections structure
        const session = sessionService.getSessionById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Create feedback sections based on session sections
        const feedbackSections = session.sections.map(sessionSection => {
            // Find matching feedback data for this section
            const feedbackSection = feedbackData.sections?.find(s => s.key === sessionSection.key);
            
            return {
                key: sessionSection.key,
                title: sessionSection.title,
                items: feedbackSection?.items || [],
                actionItem: {
                    status: "Closed", // Default to Closed
                    assignee: null,
                    dueDate: null
                }
            };
        });

        const feedback = { 
            id: Date.now(),
            sessionId,
            username: feedbackData.username,
            sections: feedbackSections,
            votes: 0,
            votedBy: [],
            createdAt: new Date().toISOString()
        };
        
        fs.appendFileSync(feedbackFile, JSON.stringify(feedback) + '\n');
        return feedback;
    }

    // Helper method to filter empty sections
    filterEmptySections(feedback) {
        return {
            ...feedback,
            sections: feedback.sections.filter(section => 
                section.items && section.items.length > 0
            )
        };
    }

    // Toggle action item status between Open and Closed
    toggleActionItemStatus(feedbackId, sectionKey, newStatus) {
        if (!fs.existsSync(feedbackFile)) {
            throw new Error('Feedback file not found');
        }

        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        const feedbackIndex = feedbacks.findIndex(f => f.id == feedbackId);
        
        if (feedbackIndex === -1) {
            throw new Error('Feedback not found');
        }

        const feedback = feedbacks[feedbackIndex];
        const section = feedback.sections?.find(s => s.key === sectionKey);

        if (!section) {
            throw new Error('Section not found');
        }

        // Validate status
        const validStatuses = ['Open', 'Closed'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid status. Must be either "Open" or "Closed"');
        }

        // Update status
        if (section.actionItem) {
            section.actionItem.status = newStatus;
            section.actionItem.updatedAt = new Date().toISOString();
        }

        const updatedContent = feedbacks.map(f => JSON.stringify(f)).join('\n') + '\n';
        fs.writeFileSync(feedbackFile, updatedContent);

        return feedback;
    }

    // Update action item (assignee and dueDate only when Open)
    updateActionItem(feedbackId, sectionKey, updateData) {
        if (!fs.existsSync(feedbackFile)) {
            throw new Error('Feedback file not found');
        }

        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        const feedbackIndex = feedbacks.findIndex(f => f.id == feedbackId);
        
        if (feedbackIndex === -1) {
            throw new Error('Feedback not found');
        }

        const feedback = feedbacks[feedbackIndex];
        const section = feedback.sections?.find(s => s.key === sectionKey);

        if (!section) {
            throw new Error('Section not found');
        }

        if (!section.actionItem) {
            throw new Error('Action item not found');
        }

        // Check if action item is Open
        if (section.actionItem.status !== 'Open') {
            throw new Error('Action item must be Open to update assignee or due date');
        }

        // Update allowed fields
        if (updateData.assignee !== undefined) section.actionItem.assignee = updateData.assignee;
        if (updateData.dueDate !== undefined) section.actionItem.dueDate = updateData.dueDate;
        
        section.actionItem.updatedAt = new Date().toISOString();

        const updatedContent = feedbacks.map(f => JSON.stringify(f)).join('\n') + '\n';
        fs.writeFileSync(feedbackFile, updatedContent);

        return feedback;
    }

    // Get all action items for a session (for session creator) - filter empty sections
    getSessionActionItems(sessionId) {
        if (!fs.existsSync(feedbackFile)) return [];
        
        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line))
            .filter(f => f.sessionId == sessionId);

        const allActionItems = [];
        
        feedbacks.forEach(feedback => {
            feedback.sections?.forEach(section => {
                // Only include sections with items
                if (section.items && section.items.length > 0 && section.actionItem) {
                    allActionItems.push({
                        feedbackId: feedback.id,
                        username: feedback.username,
                        sectionKey: section.key,
                        sectionTitle: section.title,
                        items: section.items,
                        actionItem: section.actionItem
                    });
                }
            });
        });

        return allActionItems;
    }

    getFeedbackById(feedbackId) {
        if (!fs.existsSync(feedbackFile)) {
            throw new Error('Feedback file not found');
        }
        
        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        const feedback = feedbacks.find(f => f.id == feedbackId);
        
        if (!feedback) {
            throw new Error('Feedback not found');
        }
        
        // Filter out empty sections
        return this.filterEmptySections(feedback);
    }

    getFeedbackBySessionId(sessionId) {
        if (!fs.existsSync(feedbackFile)) return [];
        
        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line))
            .filter(f => f.sessionId == sessionId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Filter out empty sections from all feedbacks
        return feedbacks.map(feedback => this.filterEmptySections(feedback));
    }

    getFeedbackBySessionAndSection(sessionId, sectionKey) {
        if (!fs.existsSync(feedbackFile)) return [];
        
        const allFeedback = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line))
            .filter(f => f.sessionId == sessionId);
        
        const sectionItems = [];
        allFeedback.forEach(feedback => {
            const section = feedback.sections?.find(s => s.key === sectionKey);
            // Only include sections with items
            if (section && section.items && section.items.length > 0) {
                section.items.forEach(item => {
                    sectionItems.push({
                        feedbackId: feedback.id,
                        username: feedback.username,
                        item: item,
                        votes: feedback.votes || 0,
                        actionItem: section.actionItem,
                        createdAt: feedback.createdAt
                    });
                });
            }
        });
        
        return sectionItems.sort((a, b) => b.votes - a.votes);
    }

    voteFeedback(feedbackId, username) {
        if (!fs.existsSync(feedbackFile)) {
            throw new Error('Feedback file not found');
        }

        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        const feedbackIndex = feedbacks.findIndex(f => f.id == feedbackId);
        
        if (feedbackIndex === -1) {
            throw new Error('Feedback not found');
        }

        const feedback = feedbacks[feedbackIndex];
        
        if (!feedback.votedBy) {
            feedback.votedBy = [];
        }
        
        if (feedback.votedBy.includes(username)) {
            throw new Error('User already voted for this feedback');
        }

        feedback.votes = (feedback.votes || 0) + 1;
        feedback.votedBy.push(username);

        const updatedContent = feedbacks.map(f => JSON.stringify(f)).join('\n') + '\n';
        fs.writeFileSync(feedbackFile, updatedContent);

        return this.filterEmptySections(feedback);
    }

    unvoteFeedback(feedbackId, username) {
        if (!fs.existsSync(feedbackFile)) {
            throw new Error('Feedback file not found');
        }

        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        const feedbackIndex = feedbacks.findIndex(f => f.id == feedbackId);
        
        if (feedbackIndex === -1) {
            throw new Error('Feedback not found');
        }

        const feedback = feedbacks[feedbackIndex];
        
        if (!feedback.votedBy || !feedback.votedBy.includes(username)) {
            throw new Error('User has not voted for this feedback');
        }

        feedback.votes = Math.max((feedback.votes || 0) - 1, 0);
        feedback.votedBy = feedback.votedBy.filter(u => u !== username);

        const updatedContent = feedbacks.map(f => JSON.stringify(f)).join('\n') + '\n';
        fs.writeFileSync(feedbackFile, updatedContent);

        return this.filterEmptySections(feedback);
    }

    getFeedbackByUser(username) {
        if (!fs.existsSync(feedbackFile)) return [];
        
        const feedbacks = fs.readFileSync(feedbackFile, 'utf-8')
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
        
        // Filter out empty sections from all feedbacks
        return feedbacks.map(feedback => this.filterEmptySections(feedback));
    }
}

module.exports = new FeedbackService();