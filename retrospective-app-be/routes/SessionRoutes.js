const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/SessionController");
const { verifyToken } = require("../middlewares/auth");


router.get("/", sessionController.getAllSessions);
router.get("/recent", sessionController.getRecentSession);
router.get("/:sessionId", sessionController.getSessionById);
router.get("/team/:team", sessionController.getSessionByTeam);
router.get("/:sessionId/members", sessionController.getSessionMembers);
router.get("/user/sessions", verifyToken, sessionController.getUserSessions);

router.post("/", verifyToken, sessionController.addSession);

router.patch("/add-section/:sessionId", verifyToken, sessionController.addSectionBySessionId);
router.patch("/:sessionId/join", verifyToken, sessionController.joinSession);
router.patch("/delete-section/:sessionId", verifyToken, sessionController.deleteSectionBySessionId);

module.exports = router;
