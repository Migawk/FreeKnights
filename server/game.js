import _ from "lodash";
import Player from "./engine/player.js";
import LocationObject from "./engine/object.js";
import { readFileSync } from "fs";
import { generateName, judge } from "./engine/utils.js";
import Item from "./engine/item.js";
import { spawnObjectAfterDead } from "./engine/helpers.js";

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
        new LocationObject(600 - 32 - 4, 200, 32, 48, "./assets/door.png", [
          "changeLocation",
          {
            location: "valley",
            coords: {
              x: 4,
              y: 200,
            },
          },
        ]),
        new LocationObject(200, 50, 10, 10, "./assets/poison.png", [
          "item",
          new Item("Heal", 1, 2, "poison.png", "heal"),
        ]),
      ],
    },
    valley: {
      players: [],
      objects: [
        new LocationObject(4, 200, 32, 48, "./assets/door.png", [
          "changeLocation",
          {
            location: "tovern",
            coords: {
              x: 600 - 32 - 4,
              y: 200,
            },
          },
        ]),
      ],
    },
  };

  function generateNPC(socket) {
    const res = _.find(locations.valley.players, { control: "hero" });
    if (res && locations.valley.players.length < 5) {
      const npc = new Player(
        Math.random() * 600,
        Math.random() * 400,
        "npc",
        undefined,
        undefined,
        undefined,
        generateName(),
        null
      );
      locations.valley.players.push(npc);
      socket.to("valley").emit("commit", { event: "newUser", payload: npc });
    }
  }

  io.on("connection", (socket) => {
    setInterval(() => generateNPC(socket), 1000);

    let statePlayer = {};
    socket.on("acquaint", (userData, callback) => {
      if (users.findIndex((user) => user.name == userData.name) !== -1) {
        socket.disconnect();
        return callback({
          status: "bad",
          message: "Name is already taken. Choose another one",
        });
      }

      const initLocation = "valley";

      callback({
        userList: locations.tovern.players,
        objects: locations.tovern.objects,
        location: initLocation,
      });
      statePlayer = userData;
      users.push(userData);

      socket.join(initLocation);
      io.to(initLocation).emit("newUser", statePlayer);
      statePlayer.location = initLocation;
    });

    socket.on("commit", (commit) => {
      const location = locations[statePlayer.location];
      switch (commit.event) {
        case "hit": {
          const { arrow, player } = commit.payload;

          if (judge(arrow, player)) {
            const res = {
              locationName: statePlayer.location,
              playerIndex: _.findKey(location.players, ["name", player.name]),
            };
            if (!res.playerIndex) return;

            const newList = location.players.filter(
              (player1) =>
                player1.name != location.players[res.playerIndex].name
            );
            if (player.control == "npc") {
              const newObj = spawnObjectAfterDead(player);
              if (newObj) location.objects.push(newObj);
            }
            location.players = newList;
          }
          break;
        }
        case "movement": {
          const userInd = users.findIndex(
            (user) => user.name == commit.payload.name
          );
          if (userInd === -1) return;
          users[userInd] = commit.payload;
          statePlayer = { ...commit.payload, location: statePlayer.location };

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

          statePlayer.location = commit.payload.name;
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
        case "takenObj": {
          let list = locations[statePlayer.location].objects;
          const obj = _.find(list, {
            id: commit.payload.obj.id,
          });

          if (obj) {
            locations[statePlayer.location].objects = _.filter(
              list,
              (o) => o.id != commit.payload.obj.id
            );
          }

          break;
        }
      }

      socket.broadcast.to(statePlayer.location).emit("commit", {
        event: commit.event,
        payload: { ...commit.payload, location },
      });
    });
    socket.on("disconnect", () => {
      users = users.filter((user) => user.name !== statePlayer.name);
      socket.emit("commit", { event: "leaveUser", payload: statePlayer });
    });
  });
}
