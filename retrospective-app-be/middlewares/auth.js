const jwt = require("jsonwebtoken");
const User = require("../models/Users.js");
require("dotenv").config();

const secret = `${process.env.ACCESS_TOKEN_SECRET}`;
const getEndOfDayExpiring = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return Math.floor((end.getTime() - Date.now()) / 1000)
}

module.exports.createAccessToken = (user) => {
  const data = {
    id: user._id,
    email: user.email,
    username: user.username
  };

  return jwt.sign(data, secret, { expiresIn: getEndOfDayExpiring() });
};

module.exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Failed: No access token provided",
      });
    }

    jwt.verify(token, secret, async (err, decodedToken) => {
      if (err) {
        return res.status(403).json({
          auth: "Failed",
          message: err.message,
        });
      }

      const user = await User.findById(decodedToken.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      req.user = decodedToken;
      next();
    });
  } catch (err) {
    console.error("VerifyToken Error:", err);
    return res.status(500).json({
      message: "Server error during token verification",
    });
  }
};
