require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const redis = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const pubClient = redis.createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

server.listen(port, () => {
  console.log(`Websocket server listening on port ${port}`);
});
