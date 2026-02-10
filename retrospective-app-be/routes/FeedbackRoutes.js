const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/FeedbackController");
const { verifyToken } = require("../middlewares/auth");

router.get("/:sessionId", verifyToken, feedbackController.getFeedbackBySessionId);
router.get("/:sessionId/section/:sectionKey", verifyToken, feedbackController.getFeedbackBySessionAndSection);
router.get("/user/session-feedbacks", verifyToken, feedbackController.getFeedbackByUserAndSession)
router.get("/session/:sessionId/filter/:memberId", feedbackController.filterFeedbacksByMember);

router.post("/:sessionId", verifyToken, feedbackController.addFeedbackBySection);

router.patch("/:feedbackId/vote", verifyToken, feedbackController.voteByFeedbackId);
router.patch("/:feedbackId/unvote", verifyToken, feedbackController.unvoteByFeedbackId);
router.patch("/:feedbackId/toggle-visibility", verifyToken, feedbackController.toggleFeedbackVisibilitykById);
router.patch("/:feedbackId/action-items", verifyToken, feedbackController.updateActionItems);

module.exports = router;
