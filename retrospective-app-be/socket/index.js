const { Server } = require("socket.io");
const { getTimerSyncPayload, handleTimerCommand } = require("./timerManager");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:4200",
        "https://csx-retrospective-app.vercel.app",
        "https://cs-retrospective-app.vercel.app"
      ],
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a session room
    socket.on("join:session", (sessionId) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session: ${sessionId}`);

      const timerSyncPayload = getTimerSyncPayload(sessionId);
      if (timerSyncPayload) {
        socket.emit("timer:sync", timerSyncPayload);
      }
    });

    // Leave a session room
    socket.on("leave:session", (sessionId) => {
      socket.leave(sessionId);
      console.log(`Socket ${socket.id} left session: ${sessionId}`);
    });

    socket.on("timer:command", (commandData = {}) => {
      handleTimerCommand(io, commandData);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };