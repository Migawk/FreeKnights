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
  players = [];
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

    let arrows = [];
    this.players.forEach((player) => {
      player.update();
      arrows.push(player.arrows);
      arrows = arrows.flat(1);
    });
    arrows.forEach((arrow) => {
      this.players.forEach((player) => {
        const col = collision(arrow, player);
        if (col.isTouch) {
          if (player.arrows.includes(arrow)) return;
          this.players = this.players.filter((player1) => player1 != player);
          if (arrow.shooter.arrows)
            arrow.shooter.arrows = arrow.shooter.arrows.filter(
              (arr) => arr != arrow
            );
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

    ctx.restore();
  }
}

function start(name) {
  document.body.append(canvas);

  const hero = new Player(
    canvas.width / 2,
    canvas.height / 2,
    "hero",
    14,
    13,
    1,
    name
  );
  const locationEntity = new Location();
  const game = new Game([hero], locationEntity, hero);
  const actions = new CommitActions(game);

  socket.timeout(5000).emit("acquaint", hero, (err, res) => {
    if (err) return;

    const { userList } = res;

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
  socket.on("commit", (commit) => {
    if (game.players.findIndex((user) => user.name == hero.name)) {
      socket.disconnect();
      return;
    }

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
      default:
        break;
    }
  });

  setInterval(() => {
    game.update();
  }, 1000 / 10);
}
