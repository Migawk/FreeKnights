import _ from "lodash";
import Player from "./assets/player.js";
import LocationObject from "./assets/object.js";
import { readFileSync } from "fs";
import { judge } from "./assets/utils.js";
import Item from "./assets/item.js";

export default function game(io) {
  const dialoguesJSON = JSON.parse(
    readFileSync("./assets/dialogues.json", "utf-8")
  );

  let users = [
    new Player(60, 60, "npc", 14, 13, 1, "Ove", dialoguesJSON["ove"]),
    new Player(60, 120, "npc", 14, 13, 1, "Bjorn", dialoguesJSON["bjorn"]),
  ];

  let locations = {
    tovern: {
      players: users.slice(0, 2),
      objects: [
        new LocationObject(200, 200, 120, 38, "./assets/table.png", [
          "changeLocation",
          "valley",
        ]),
        new LocationObject(200, 50, 10, 10, "./assets/poison.png", [
          "item",
          new Item("Heal", 1, 2, "poison.png", "heal"),
        ]),
      ],
    },
    valley: {
      players: [],
      objects: [],
    },
  };

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

      callback({ userList: users, objects: locations.tovern.objects });
      statePlayer = userData;
      users.push(userData);

      socket.join("tovern");
      io.to("tovern").emit("newUser", statePlayer);
    });

    socket.on("commit", (commit) => {
      switch (commit.event) {
        case "hit": {
          const { arrow, player } = commit.payload;

          if (judge(arrow, player)) {
            Object.entries(locations).forEach((location) => {
              const res = {
                locationName: location[0],
                playerIndex: _.findKey(location[1].players, [
                  "name",
                  player.name,
                ]),
              };
              if (!res.playerIndex) return;

              const newList = locations[location[0]].players.filter(
                (player1) =>
                  player1.name != location[1].players[res.playerIndex].name
              );
              locations[location[0]].players = newList;
              socket.broadcast.emit("commit", {
                event: commit.event,
                payload: commit.payload,
              });
            });
          }
          break;
        }
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
            locations[commit.payload.name] = {
              players: [statePlayer],
              objects: [],
            };
          } else {
            const list = locations[commit.payload.name].players;
            locations[commit.payload.name] = {
              players: [...list, statePlayer],
              objects: [...locations[commit.payload.name].objects],
            };
          }
          const rooms = socket.rooms;

          rooms.forEach((room) => {
            socket.leave(room);
            socket
              .to(room)
              .emit("commit", { event: "leaveUser", payload: statePlayer });

            if (!locations[room])
              locations[room] = { players: [], objects: [] };
            const list = Array.from(
              new Set(
                locations[room].players.filter(
                  (e) => e.name != statePlayer.name
                )
              )
            );

            locations[room].players = list;
          });

          io.to(commit.payload.name).emit("commit", {
            event: "newUser",
            payload: statePlayer,
          });

          const userList = [...locations[commit.payload.name].players].filter(
            (u) => u.name != statePlayer.name
          );
          socket.emit("commit", {
            event: "changeLocation",
            payload: {
              players: userList,
              objects: locations[commit.payload.name].objects,
            },
          });

          socket.join(commit.payload.name);

          return;
        }
      }
      if (commit.event == "hit") return;
      socket.broadcast.emit("commit", {
        event: commit.event,
        payload: commit.payload,
      });
    });
    socket.on("disconnect", () => {
      users = users.filter((user) => user.name !== statePlayer.name);
      socket.emit("commit", { event: "leaveUser", payload: statePlayer });
    });
  });
}
