import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { Server } from "socket.io";
import Player from "./player.js";

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
let locations = {};

locations.tovern = [
  new Player(60, 60, "npc", 14, 13, 1, "Ove"),
  new Player(60, 120, "npc", 14, 13, 1, "Bjorn"),
];
locations.valley = [];

io.on("connection", (socket) => {
  let statePlayer = {};
  socket.on("acquaint", (userData, callback) => {
    if (users.findIndex((user) => user.name == userData.name) !== -1) {
      socket.disconnect();
      return callback({
        status: "bad",
        message: "Name is already taken. Choose another one",
      });
    }

    callback({ userList: users });
    statePlayer = userData;
    users.push(userData);

    socket.join("tovern");
    io.to("tovern").emit("newUser", statePlayer);
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
        statePlayer = commit.payload;

        break;
      }
      case "changeLocation": {
        if (!commit.payload.name) return;
        if (commit.payload.name in locations === false) {
          locations[commit.payload.name] = [statePlayer];
        } else {
          const list = locations[commit.payload.name];
          locations[commit.payload.name] = [...list, statePlayer];
        }
        const rooms = socket.rooms;

        rooms.forEach((room) => {
          socket.leave(room);
          socket
            .to(room)
            .emit("commit", { event: "leaveUser", payload: statePlayer });

          if (!locations[room]) locations[room] = [];
          const list = Array.from(
            new Set(locations[room].filter((e) => e.name != statePlayer.name))
          );

          locations[room] = list;
        });

        io.to(commit.payload.name).emit("commit", {
          event: "newUser",
          payload: statePlayer,
        });

        const userList = [...locations[commit.payload.name]].filter(
          (u) => u.name != statePlayer.name
        );
        socket.emit("commit", {
          event: "userList",
          payload: userList,
        });

        socket.join(commit.payload.name);

        return;
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
