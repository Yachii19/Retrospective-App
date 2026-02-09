const Session = require("../models/Sessions");

exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find({})
            .populate('members.sessionMember', 'username email')
            .populate('createdBy', 'username email');

        if (!sessions || sessions.length === 0) {
            return res.status(404).send({
                message: "No sessions found",
                data: []
            });
        }

        res.status(200).send({
            message: `Sessions List:`,
            data: sessions
        })
    } catch (err) {
        console.log(`Error fetching sessions: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions"
        })
    }
}

exports.getRecentSession = async (req, res) => {
    try {
        const recentSessions = await Session.find({})
            .populate('members.sessionMember', 'username email')
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 })
            .limit(9);

        if (!recentSessions || recentSessions.length === 0) {
            return res.status(200).send({
                  message: "No sessions found",
                data: []
            });
        }

        res.status(200).send({
            message: `Recent Sessions List:`,
            data: recentSessions
        });
    } catch (err) {
        console.log(`Error fetching sessions: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions"
        });
    }
}

exports.getSessionById = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const specificSession = await Session.findOne({ _id: sessionId })
            .populate('members.sessionMember', 'username email')
            .populate('createdBy', 'username email');

        if(!specificSession) {
            return res.status(404).send({
                message: `Session with ID: ${sessionId} not found!`
            });
        }

        const membersCount = Array.isArray(specificSession.members)
            ? specificSession.members.length
            : 0;


        res.status(200).send({
            message: `Session with the ID: ${sessionId} found!`,
            data: specificSession,
            membersCount
        });
    } catch (err) {
        console.log(`Error fetching specific session: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching specific session"
        });
    }
    
}

exports.getSessionByTeam = async (req, res) => {
    try {
        const team = req.params.team;
        const teamSesssions = await Session.find({ team: team })
            .populate('members.sessionMember', 'username email')
            .populate('createdBy', 'username email');

        if (!teamSesssions || teamSesssions.length === 0) {
            return res.status(404).send({
                message: `No sessions found on: ${team}`,
                data: []
            });
        }

        res.status(200).send({
            message: `List of session in ${team}`,
            data: teamSesssions
        })
    } catch(err) {
        console.log(`Error fetching sessions: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching sessions"
        });
    }
}

exports.getSessionMembers = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const specificSession = await Session.findById(sessionId)
            .populate('members.sessionMember', 'username email')
            .select('members');

        if(!specificSession) {
            return res.status(404).send({
                message: `Session with ID: ${sessionId} not found!`
            });
        }

        return res.status(200).send({
            message: `Session with ID: ${sessionId} members list`,
            data: specificSession
        })
    } catch (err) {
        console.log(`Error fetching session members: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching session members"
        });
    }
}

exports.getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const userSessions = await Session.find({ createdBy: userId })
            .populate('members.sessionMember', 'username email')
            .populate('createdBy', 'username email');;

        if (!userSessions || userSessions.length === 0) {
            return res.status(404).send({
                  message: "No sessions found",
                data: []
            });
        }

        return res.status(200).send({
            message: `User ${userId} sessions list:`,
            data: userSessions
        })
    } catch (err) {
        console.log(`Error fetching user sessions: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching user sessions"
        });
    }
}

exports.addSession = async (req, res) => {
    try {

        const required = ["sessionName", "team"];
        const missing = required.filter((f) => !req.body[f]);

        if (missing.length) {
            return res.status(400).send({
                message: "All fields are required",
                missingFields: missing
            });
        }

        let {
            sessionName,
            team,
            sections
        } = req.body

        const validTeams = ['MYS Team', 'CSM Team'];
        if (!validTeams.includes(team)) {
            return res.status(400).send({
                message: 'Invalid team. Must be either "MYS Team" or "CSM Team"'
            });
        }

        let defaultSections =  [
                { key: 'went-well', title: 'Went Well' },
                { key: 'needs-improvement', title: 'Needs Improvement' },
                { key: 'action-items', title: 'Action Items'}
            ]

        if (sections.length === 0 || !sections || !Array.isArray(sections)) {
            sections = defaultSections
        }

        const newSession = new Session({
            sessionName,
            team,
            sections: sections,
            members: [{
                sessionMember: req.user.id
            }],
            createdBy: req.user.id
        })

        await newSession.save();

        return res.status(201).send({
            message: "Session created successfully",
            data: newSession
        })

    } catch (err) {
        console.log(`Error creating session: ${err}`);
        return res.status(500).send({
            message: "Server error when creating session"
        });
    }
}

exports.joinSession = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const specificSession = await Session.findById(sessionId);

        if(!specificSession) {
            return res.status(404).send({
                message: `Session with ID: ${sessionId} not found!`
            });
        }

        const isMember = specificSession.members.some(member => member.sessionMember.toString() === req.user.id);

        if(isMember) {
            return res.status(200).send({
                message: `User is already a member of this session`
            });
        }

        specificSession.members.push({
            sessionMember: req.user.id
        });

        await specificSession.save();

        return res.status(200).send({
            message: "Successfully joined session",
            data: specificSession
        });

    } catch (err) {
        console.log(`Error joining session: ${err}`);
        return res.status(500).send({
            message: "Server error when joining session"
        });
    }
}