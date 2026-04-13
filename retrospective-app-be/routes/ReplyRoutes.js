const express = require('express');
const router = express.Router();
const replyController = require('../controllers/ReplyController');
const { verifyToken } = require('../middlewares/auth');

router.get('/:feedbackId', verifyToken, replyController.getAllRepliesByFeedbackId);

router.post('/add-reply/:feedbackId', verifyToken, replyController.createReplyByFeedbackId);

router.put('/:replyId',  verifyToken, replyController.updateReplyById);
module.exports = router;