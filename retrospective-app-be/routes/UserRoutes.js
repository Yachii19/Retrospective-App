const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { verifyToken, authorizeRoles } = require("../middlewares/auth");

router.get("/profile", verifyToken, userController.getUserProfile);
router.patch('/profile/username', verifyToken, userController.changeUsername);
router.patch('/profile/password', verifyToken, userController.changePassword);
router.patch('/profile/pin', verifyToken, userController.changePin);
router.get('/search', verifyToken, authorizeRoles("admin"), userController.searchUsers);

module.exports = router;