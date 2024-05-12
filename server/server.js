import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(process.env.PWD, "cli", "index.html"));
});
const handle = (req, res, next) => {
  res.sendFile(join(process.env.PWD, "cli", req.path));
  next();
};
app.get("/:path", [handle], () => {});
app.get("/*/:path", [handle], () => {});

let users = [];
io.on("connection", (socket) => {
  let statePlayer = {};
  socket.on("acquaint", (userData, callback) => {
    if (users.findIndex((user) => user.name == userData.name) !== -1)
      return callback({
        status: "bad",
        message: "Name is already taken. Choose another one",
      });

    callback({ userList: users });
    statePlayer = { ...userData };
    users.push(userData);
    socket.broadcast.emit("commit", { event: "newUser", payload: userData });
  });
  socket.on("commit", (commit) => {
    socket.broadcast.emit("commit", {
      event: commit.event,
      payload: commit.payload,
    });
    switch (commit.event) {
      case "movement": {
        const userInd = users.findIndex(
          (user) => user.name == commit.payload.name
        );
        if (userInd === -1) return;
        users[userInd] = commit.payload;
        break;
      }
    }
  });
  socket.on("disconnect", () => {
    users = users.filter((user) => user.name !== statePlayer.name);
    socket.emit("commit", { event: "leaveUser", payload: statePlayer });
  });
});
server.listen(3055, () => {
  console.log("server running at http://localhost:3055");
});
