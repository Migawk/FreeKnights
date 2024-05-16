import keys from "../engine/keys.js";
import Player from "../engine/player.js";
import Location from "../engine/location.js";
import {
  CommitActions,
  collision,
  distance,
  padding,
} from "../engine/utils.js";
import LocationObject from "../engine/object.js";

const form = document.getElementById("form");
const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 400;
canvas.id = "canvas";

const interaction = new Image();
interaction.src = "../assets/interaction.png";
interaction.height = 20;

export const ctx = canvas.getContext("2d");
const crosshair = new Image();
crosshair.src = "./assets/crosshair.png";
const { x: canvasX, y: canvasY } = canvas.getBoundingClientRect();
export const pointer = {
  x: 0,
  y: 0,
};

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});
canvas.addEventListener("mousedown", (e) => {
  if (e.button == 0) {
    keys.add("shoot");
  }
  if (e.button == 2) {
    keys.add("aim");
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (e.button == 0) {
    keys.delete("shoot");
  }
  if (e.button == 2) {
    keys.delete("aim");
  }
});
canvas.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement) {
    pointer.x += e.movementX;
    pointer.y += e.movementY;
  } else {
    pointer.x = e.clientX - canvasX - crosshair.width;
    pointer.y = e.clientY - canvasY - crosshair.width;
  }
});

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let selected;
    form.character.forEach((e) => {
      if (e.checked) selected = e.value;
    });

    start(form.name.value, selected);
  });
}

class Game {
  message = null;

  constructor(players, locationEntity) {
    this.players = players;
    this.location = locationEntity;
  }
  updatePlayers(players) {
    this.players = players;
  }
  update() {
    const player = this.players[0];
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.location.update();

    this.players.forEach((player) => {
      player.update();
    });
    player.arrows.forEach((arrow) => {
      this.players.slice(1).forEach((player) => {
        const col = collision(arrow, player);
        if (col.isTouch) {
          this.players[0].arrows = this.players[0].arrows.filter(
            (arrow1) => arrow != arrow1
          );
          socket.emit("commit", {
            event: "hit",
            payload: {
              arrow,
              player,
            },
          });
        }
      });
    });

    if (keys.has("aim")) {
      ctx.drawImage(crosshair, pointer.x + 16, pointer.y + 16);

      ctx.strokeStyle = "red";
      ctx.strokeWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(pointer.x + crosshair.width, pointer.y + crosshair.width);
      ctx.stroke();
      ctx.fill();
    }

    ctx.fillStyle = "#3c1003ee";
    ctx.font = "bold 24px Arial";

    const locationName =
      this.location.currentLocation.name.slice(0, 1).toUpperCase() +
      this.location.currentLocation.name.slice(1);
    const { width: nameWidth } = ctx.measureText(locationName);
    ctx.fillText(locationName, canvas.width - nameWidth - 8, 8 + 16);
    if (this.message) {
      ctx.fillRect(4, 400 - 60 - 4, 600 - 8, 60);
      ctx.fillStyle = "#ccccccee";
      ctx.font = "bold 16px Arial";
      ctx.fillText(this.message.text, 16, 400 - 60 + 20);
    }

    ctx.fillStyle = "#3c1003bb";

    if (!player.isBusy) {
      // When the player is duscussing something.
      const length = 140;

      /** Panel **/
      ctx.save();
      ctx.translate(0, 400);
      ctx.fillRect(4, -54, 150, 50);
      ctx.translate(4, -54);
      const stamina =
        player.stamina > length
          ? length
          : player.stamina < 0
          ? 0
          : player.stamina;

      ctx.fillStyle = "#0a7326bb";
      ctx.fillRect(4, 4, 10, 20);
      ctx.fillStyle = "#260a73bb";
      ctx.fillRect(4, 26, stamina, 20);
      ctx.restore();

      /** Inventory **/
      ctx.save();
      ctx.translate(0, canvas.height - 30);
      ctx.translate(padding + 150 + padding, 0);
      for (let i = 0; i <= player.inventory.length; i++) {
        ctx.fillRect(4, 0 - padding, 30, 30);
        ctx.translate(30 + padding, 0);
      }
      ctx.restore();

      /** Abilities */
      ctx.save();
      ctx.translate(canvas.width - 40, canvas.height - 40);
      for (let i = 0; i <= player.abilities.length; i++) {
        ctx.fillRect(-4, 0 - padding, 40, 40);
        ctx.translate(-40 - padding, 0);
      }
      ctx.restore();
    }

    let objectUnderCloud = { obj: null, dist: null };
    this.players.forEach((player1, ind) => {
      if (ind === 0) return;
      collision(this.players[0], player1);
      if (!player.isBusy) {
        const dist = distance(player.x, player.y, player1.x, player1.y);
        if (dist < 30) {
          if (objectUnderCloud.obj) {
            if (dist < objectUnderCloud.dist) {
              objectUnderCloud = { obj: player1, dist };
            }
          } else {
            objectUnderCloud = { obj: player1, dist };
          }
        }
      }
    });
    this.location.objects.forEach((obj) => {
      collision(player, obj);
      if (!player.isBusy) {
        const dist = distance(player.x, player.y, obj.x, obj.y);
        if (dist < 30) {
          if (objectUnderCloud.obj) {
            if (dist < objectUnderCloud.dist) {
              objectUnderCloud = { obj, dist };
            }
          } else objectUnderCloud = { obj, dist };
        }
      }
    });
    if (objectUnderCloud.obj) {
      ctx.save();
      const x = objectUnderCloud.obj.x + objectUnderCloud.obj.width / 2;
      const y = objectUnderCloud.obj.y - objectUnderCloud.obj.height / 2;
      ctx.translate(x, y);
      ctx.scale(.5,.5)
      ctx.arc(-4, -34, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.drawImage(interaction, -16, -48);
      ctx.restore();
    }

    if (keys.has("aim") && keys.has("shoot")) {
      keys.delete("shoot");
      const arrow = player.attack.shoot(pointer);
      socket.emit("commit", { event: "newBullet", payload: arrow });
    }
  }
}

start("Migawka", "archer"); // uses only for tests
/**
 *
 * @param {string} name
 * @param {"archer" | "knight" | "wizard" | "rogue"} character
 */
function start(name, character) {
  document.body.append(canvas);

  const hero = new Player(
    80,
    140,
    "hero",
    14,
    13,
    0.7,
    name,
    undefined,
    character,
    [1, 2, 3, 4]
  );
  console.log(hero);
  const locationEntity = new Location();
  const game = new Game([hero], locationEntity, hero);
  const actions = new CommitActions(game, hero);

  document.addEventListener("keydown", (e) => {
    if (hero.isBusy) return;
    switch (e.key) {
      case "Enter": {
        const messageStatus = document.getElementById("message");

        if (messageStatus) {
          const content = messageStatus.value;

          messageStatus.remove();
          if (content.length > 0) {
            socket.emit("commit", {
              event: "newMessage",
              payload: { author: hero.name, content },
            });

            setTimeout(() => {
              hero.removeMessage(content);

              socket.emit("commit", {
                event: "delMessage",
                payload: { author: hero.name, content },
              });
            }, 5000);
          }

          return;
        }

        const message = document.createElement("input");
        message.placeholder = "Message";
        message.id = "message";
        message.max = 5;

        document.body.appendChild(message);

        message.focus();
        break;
      }
      case "l": {
        if (locationEntity.currentLocation.name === "valley") {
          locationEntity.change("tovern");
        } else locationEntity.change("valley");
        break;
      }
      case "e": {
        let selectedObj;
        let closestPlayer;

        if (game.location.objects.length > 0) {
          for (let i = 0; i <= 0; i++) {
            const obj = game.location.objects[0];
            const { isTouch } = collision(hero, obj);
            if (!selectedObj && isTouch) {
              selectedObj = obj;
              break;
            }
          }
        }

        if (selectedObj) {
          const [type, value] = selectedObj.interaction;
          switch (type) {
            case "changeLocation": {
              locationEntity.change(value);
            }
          }
          return;
        }

        game.players.forEach((player) => {
          if (player.name === hero.name) return;
          const dist = distance(hero.x, hero.y, player.x, player.y);
          if (!closestPlayer) closestPlayer = { player, dist };
          if (dist < closestPlayer.dist) closestPlayer = { player, dist };
        });
        if (
          closestPlayer &&
          closestPlayer.dist < 50 &&
          closestPlayer.player.dialog
        ) {
          actions.displayDialog(closestPlayer.player.dialog);
          hero.isBusy = true;
        }
      }
    }
  });
  socket.timeout(5000).emit("acquaint", hero, (err, res) => {
    if (err) return;

    const { userList, objects } = res;
    locationEntity.objects = objects.map(
      (obj) =>
        new LocationObject(
          obj.x,
          obj.y,
          obj.width,
          obj.height,
          obj.img,
          obj.interaction,
          obj.sliceX,
          obj.sliceY
        )
    );

    if (Array.isArray(userList)) {
      const newList = [];
      newList.concat(game.players);

      userList.forEach((user) => {
        newList.push(
          new Player(
            user.x,
            user.y,
            "player",
            undefined,
            undefined,
            undefined,
            user.name
          )
        );
      });
      game.updatePlayers(game.players.concat(newList));
    }
  });

  socket.emit("commit", {
    event: "changeLocation",
    payload: { name: "tovern" },
  });

  socket.on("commit", (commit) => {
    switch (commit.event) {
      case "newUser": {
        actions.newUser(commit.payload);
        break;
      }
      case "leaveUser": {
        actions.leaveUser(commit.payload);
        break;
      }
      case "movement": {
        actions.movement(commit.payload);
        break;
      }
      case "newBullet": {
        actions.newBullet(commit.payload);
        break;
      }
      case "leaveBullet": {
        actions.leaveBullet(commit.payload);
        break;
      }
      case "newMessage": {
        actions.addMessage(commit.payload.author, commit.payload.content);
        break;
      }
      case "delMessage": {
        actions.removeMessage(commit.payload.author, commit.payload.content);
        break;
      }
      case "userList": {
        actions.userList(commit.payload);
        break;
      }
      case "hit": {
        const { arrow, player } = commit.payload;
        actions.hit(arrow, player);
        break;
      }
      case "changeLocation": {
        const { players, objects } = commit.payload;
        actions.changeLocation(players, objects);
        return;
      }
      default:
        break;
    }
  });

  socket.on("disconnect", () => {
    ctx.fillStyle = "#88888888";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    clearInterval(intervalId);
    return;
  });
  const intervalId = setInterval(() => {
    if (game.players.findIndex((player) => player.name == hero.name) === -1) {
      socket.disconnect();
      ctx.fillStyle = "#88888888";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      clearInterval(intervalId);
      return;
    }
    game.update();
  }, 1000 / 10);
}
