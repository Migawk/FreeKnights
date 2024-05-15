const form = document.getElementById("form");
const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 400;
canvas.id = "canvas";
const ctx = canvas.getContext("2d");
const crosshair = new Image();
crosshair.src = "./assets/crosshair.png";
const { x: canvasX, y: canvasY } = canvas.getBoundingClientRect();
const pointer = {
  x: 0,
  y: 0,
};

canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
});
canvas.addEventListener("mousedown", (e) => {
  if (e.button == 0) {
    keys.push("shoot");
  }
  if (e.button == 2) {
    keys.push("aim");
  }
});
canvas.addEventListener("mouseup", (e) => {
  if (e.button == 0) {
    keys.removeKey("shoot");
  }
  if (e.button == 2) {
    keys.removeKey("aim");
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
    start(form.name.value);
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
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.location.update();

    this.players.forEach((player) => {
      player.update();
    });
    this.players[0].arrows.forEach((arrow) => {
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

    if (keys.includes("aim")) {
      ctx.drawImage(crosshair, pointer.x + 16, pointer.y + 16);

      ctx.strokeStyle = "red";
      ctx.strokeWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.players[0].x, this.players[0].y);
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
    ctx.restore();
    this.players.forEach((player, ind) => {
      if (ind === 0) return;
      // collision(this.players[0], player);
    });
    this.location.objects.forEach((obj) => {
      collision(this.players[0], obj);
    });
  }
}

start("Migawka"); // uses only for tests
function start(name) {
  document.body.append(canvas);

  const hero = new Player(80, 140, "hero", 14, 13, 0.7, name);
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
          socket.emit("commit", {
            event: "newMessage",
            payload: { author: hero.name, content },
          });

          hero.addMessage(content);
          setTimeout(() => {
            hero.removeMessage(content);

            socket.emit("commit", {
              event: "delMessage",
              payload: { author: hero.name, content },
            });
          }, 5000);

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
        let closestPlayer;

        game.players.forEach((player) => {
          if (player.name === hero.name) return;
          const dist = distance(hero.x, hero.y, player.x, player.y);
          if (!closestPlayer) closestPlayer = { player, dist };
          if (dist < closestPlayer.dist) closestPlayer = { player, dist };
        });
        if (closestPlayer.dist < 50 && closestPlayer.player.dialog) {
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
