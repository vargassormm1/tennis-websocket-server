require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();
const port = process.env.PORT;
const server = http.createServer(app);
const io = socketIo(server, {
  transports: ["websocket", "polling"],
});

const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL;
const pubClient = redis.createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.error("Redis pubClient error:", err);
});

subClient.on("error", (err) => {
  console.error("Redis subClient error:", err);
});

pubClient.connect().catch(console.error);
subClient.connect().catch(console.error);

io.adapter(createAdapter(pubClient, subClient));

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("a user connected");

  // Join a room for private messaging
  socket.on("join", ({ roomId }) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
  });

  // Handle chat messages
  socket.on("chat message", ({ roomId, newMessage }) => {
    try {
      io.to(roomId).emit("chat message", { roomId, newMessage });
      io.emit("new message", { newMessage });
      console.log("sent");
    } catch (err) {
      console.error("Error broadcasting message:", err);
    }
  });

  socket.on("update pending match", ({ pendingMatchData }) => {
    try {
      io.emit("update pending match", { pendingMatchData });
      console.log("pending match updated");
    } catch (err) {
      console.error("Error broadcasting message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Websocket server listening on port ${port}`);
});
