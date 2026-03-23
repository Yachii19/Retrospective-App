const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { verifyToken } = require("../middlewares/auth");

router.get("/profile", verifyToken, userController.getUserProfile);
router.patch('/profile/username', verifyToken, userController.changeUsername);
router.patch('/profile/password', verifyToken, userController.changePassword);
router.patch('/profile/pin', verifyToken, userController.changePin);
module.exports = router;