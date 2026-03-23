const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { initSocket } = require("./socket/index.js");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
initSocket(server);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
        'http://localhost:4200',
        'https://csx-retrospective-app.vercel.app',
        'https://cs-retrospective-app.vercel.app'
    ],
    credentials: true,
  })
);

app.use("/api/auth", require("./routes/AuthRoutes.js"));
app.use("/api/sessions", require("./routes/SessionRoutes.js"));
app.use("/api/feedback", require("./routes/FeedbackRoutes.js"));
app.use("/api/replies", require("./routes/ReplyRoutes.js"));
app.use("/api/users", require("./routes/UserRoutes.js"));
app.use("/api/admin", require("./routes/AdminRoutes.js"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});