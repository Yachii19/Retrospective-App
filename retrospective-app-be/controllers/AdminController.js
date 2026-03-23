const User = require("../models/Users");
const Team = require("../models/Teams");
const Feedback = require("../models/Feedbacks");
const Session = require("../models/Sessions");
const Reply = require('../models/Reply');

exports.createTeam = async (req, res) => {
    try {
        const {teamName, emails} = req.body;
        const requiredFields = ['teamName', 'emails'];
        
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).send({
                message: `All fields are required!`,
                missing: missingFields
            });
        }

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).send({
                message: `Emails must be a non-empty array`
            });
        }

        const existingTeam = await Team.findOne({ teamName });
        if (existingTeam) {
            return res.status(409).send({
                message: `Team name already exists. Please choose another one.`
            });
        }

        const users = await User.find({ email: { $in: emails } });
        const foundEmails = users.map(user => user.email);
        const notFound = emails.filter(e => !foundEmails.includes(e));

        const newTeam = new Team({
            teamName,
            members: [...users.map(u => u._id), req.user.id],
            createdBy: req.user.id
        });

        await newTeam.save();

        await User.updateMany(
            { _id: { $in: [...users.map(u => u._id), req.user.id] } },
            { $addToSet: { teams: teamName } }
        );

        return res.status(200).send({
            message: `Team created successfully`,
            data: newTeam,
            notFound: notFound.length > 0 ? notFound : undefined
        });

    } catch (err) {
        console.error(`Error creating team: ${err}`);
        return res.status(500).send({
            message: `Server error when creating team: ${err}`
        });
    }
}

exports.addMemberByTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { emails } = req.body;

        const specificTeam = await Team.findById(teamId);
        if (!specificTeam) {
            return res.status(404).send({
                message: `Team with ID: ${teamId} not found!`
            });
        }

        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).send({
                message: `Emails must be a non-empty array`
            });
        }

        const users = await User.find({ email: { $in: emails } });
        if (users.length === 0) {
            return res.status(404).send({
                message: `No users found with the provided emails`
            });
        }

        const foundEmails = users.map(u => u.email);
        const notFound = emails.filter(e => !foundEmails.includes(e));

        const alreadyMembers = [];
        const toAdd = [];

        for (const user of users) {
            const isAlreadyMember = specificTeam.members.some(
                m => m.toString() === user._id.toString()
            );

            if (isAlreadyMember) {
                alreadyMembers.push(user.email);
            } else {
                toAdd.push(user);
            }
        }

        if (toAdd.length > 0) {
            const userIds = toAdd.map(u => u._id);

            await User.updateMany(
                { _id: { $in: userIds } },
                { $addToSet: { teams: specificTeam.teamName } }
            );

            specificTeam.members.push(...userIds);
            await specificTeam.save();
        }

        return res.status(200).send({
            message: `Members processed successfully`,
            added: toAdd.map(u => u.email),
            alreadyMembers,
            notFound
        });

    } catch (err) {
        console.log(`Error adding members to team: ${err}`);
        return res.status(500).send({
            message: "Server error when adding members to team"
        });
    }
}

exports.getAllTeams = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({
                message: `No user found with the ID: ${req.user.id}`
            });
        }

        const teams = await Team.find({
            $or: [
                { createdBy: req.user.id },
                { members: req.user.id }
            ]
        })
        .populate('members', 'username email')
        .populate('createdBy', 'username email');

        if (!teams || teams.length === 0) {
            return res.status(404).send({
                message: `No teams found`,
                data: []
            });
        }

        return res.status(200).send({
            message: `List of all teams:`,
            data: teams
        });

    } catch (err) {
        console.log(`Error fetching teams: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching teams"
        });
    }
}

exports.getTeamById = async (req, res) => {
    try {
        const { teamId } = req.params;

        const specificTeam = await Team.findById(teamId)
            .populate('members', 'username email')
            .populate('createdBy', 'username email');

        if (!specificTeam) {
            return res.status(404).send({
                message: `Team with the ID: ${teamId} not found!`
            });
        }

        const isMember = specificTeam.members.some(
            m => m._id.toString() === req.user.id.toString()
        );

        if (!isMember) {
            return res.status(403).send({
                message: `Access denied. You are not a member of this team.`
            });
        }

        return res.status(200).send({
            message: `Team with ID: ${teamId} found!`,
            data: specificTeam,
            membersCount: specificTeam.members.length
        });

    } catch (err) {
        console.log(`Error fetching team: ${err}`);
        return res.status(500).send({
            message: "Server error when fetching team"
        });
    }
}

exports.removeMember = async (req, res) => {
    try {
        const { teamId, userId } = req.params;

        const specificTeam = await Team.findById(teamId);
        if (!specificTeam) {
            return res.status(404).send({
                message: `Team with ID: ${teamId} not found!`
            });
        }

        const isMember = specificTeam.members.some(
            m => m.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(404).send({
                message: `User is not a member of this team`
            });
        }

        specificTeam.members = specificTeam.members.filter(
            m => m.toString() !== userId.toString()
        );
        await specificTeam.save();

        await User.findByIdAndUpdate(userId, {
            $pull: { teams: specificTeam.teamName }
        });

        return res.status(200).send({
            message: `Member removed successfully`
        });

    } catch (err) {
        console.log(`Error removing member: ${err}`);
        return res.status(500).send({
            message: "Server error when removing member"
        });
    }
}

exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;

        const specificTeam = await Team.findById(teamId);
        if (!specificTeam) {
            return res.status(404).send({
                message: `Team with ID: ${teamId} not found!`
            });
        }

        await User.updateMany(
            { _id: { $in: specificTeam.members } },
            { $pull: { teams: specificTeam.teamName } }
        );

        await Team.findByIdAndDelete(teamId);

        return res.status(200).send({
            message: `Team deleted successfully`
        });

    } catch (err) {
        console.log(`Error deleting team: ${err}`);
        return res.status(500).send({
            message: "Server error when deleting team"
        });
    }
}