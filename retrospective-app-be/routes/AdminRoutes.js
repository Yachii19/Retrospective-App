const express = require('express');
const router = express.Router();
const adminController = require("../controllers/AdminController");
const { verifyToken, authorizeRoles } = require("../middlewares/auth");


router.get("/teams", verifyToken, authorizeRoles("admin"), adminController.getAllTeams);
router.get("/teams/:teamId", verifyToken, authorizeRoles("admin"), adminController.getTeamById);
router.post("/teams/create-team", verifyToken, authorizeRoles("admin"), adminController.createTeam);
router.post("/teams/:teamId/add-members", verifyToken, authorizeRoles("admin"), adminController.addMemberByTeam);
router.delete("/teams/:teamId/members/:userId", verifyToken, authorizeRoles("admin"), adminController.removeMember);
router.delete("/teams/:teamId", verifyToken, authorizeRoles("admin"), adminController.deleteTeam);

module.exports = router;