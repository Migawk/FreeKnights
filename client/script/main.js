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
import Game from "../engine/game.js";

const form = document.getElementById("form");
const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 400;
canvas.id = "canvas";

export const ctx = canvas.getContext("2d");
export const crosshair = new Image();
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

start("Migawka", "archer"); // uses only for tests
/**
 *
 * @param {string} name
 * @param {"archer" | "knight" | "wizard" | "rogue"} character
 */
function start(name, character) {
  document.body.append(canvas);

  const hero = new Player(
    200,
    50,
    "hero",
    14,
    13,
    0.7,
    name,
    undefined,
    character,
    10,
    []
  );
  const locationEntity = new Location();
  const game = new Game([hero], locationEntity, hero);
  const actions = new CommitActions(game, hero);

  hero.effects.set("stamina", { quant: 1, time: 5 });
  hero.effects.set("regen", { quant: 1, time: 5 });
  hero.effects.set("acceleration", { quant: 3, time: 5 });

  document.addEventListener("keydown", (e) => {
    if (hero.isBusy) return;
    switch (e.key) {
      case "q": {
        console.log(hero.inventory);
      }
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
      case "e": {
        let selectedObj;
        let closestPlayer;

        if (game.location.objects.length) {
          for (let i = 0; i <= game.location.objects.length - 1; i++) {
            const obj = game.location.objects[i];

            const { isTouch } = collision(hero, obj);
            const dist = distance(hero.x, hero.y, obj.x, obj.y);

            if (!selectedObj && (isTouch || dist < 30)) {
              selectedObj = obj;
              break;
            }
          }
        }

        if (selectedObj) {
          const [type, value] = selectedObj.interaction;
          switch (type) {
            case "changeLocation": {
              const { x, y } = value.coords;
              locationEntity.change(value.location);

              hero.move(x, y);
              break;
            }
            case "item": {
              hero.inventory.push(value);
              let list = locationEntity.objects;

              locationEntity.objects = list.filter(
                (obj1) => obj1.id !== selectedObj.id
              );
              if (!hero.selectedItem) hero.selectedItem = 0;
              console.log(type);
              socket.emit("commit", {
                event: "takenObj",
                payload: { obj: selectedObj, player: hero.name },
              });
              break;
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
        break;
      }
      case "r": {
        if (hero.inventory.length == 0) return;
        const item = hero.inventory[hero.selectedItem];

        switch (item.interaction) {
          case "heal": {
            if (hero.effects.has("regen")) {
              const regen = hero.effects.get("regen");
              hero.effects.set("regen", { ...regen, time: (regen.time += 5) });
            }
            hero.effects.set("regen", { quant: 1, time: 5 });
            break;
          }
          case "stamina": {
            if (hero.effects.has("stamina")) {
              const stamina = hero.effects.get("stamina");
              hero.effects.set("stamina", {
                ...stamina,
                time: (stamina.time += 5),
              });
            }
            hero.effects.set("stamina", { quant: 1, time: 5 });
            break;
          }
          case "acceleration": {
            if (hero.effects.has("acceleration")) {
              const acceleration = hero.effects.get("acceleration");
              hero.effects.set("acceleration", {
                ...acceleration,
                time: (acceleration.time += 5),
              });
            }
            hero.effects.set("acceleration", { quant: 1, time: 5 });
            break;
          }
        }
        hero.inventory = hero.inventory.filter((item1) => item != item1);
        if (hero.inventory.length == 0) hero.selectedItem = null;
        break;
      }
      default: {
        if (!isNaN(Number(e.key)) && e.key < 4 && e.key > 0) {
          if (hero.inventory.length >= e.key-1) {
            hero.selectedItem = e.key-1;
            console.log(hero.selectedItem);
          }
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

    locationEntity.change(res.location);

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
        const { player, location } = commit.payload;
        actions.hit(location, player);
        break;
      }
      case "changeLocation": {
        const { players, objects } = commit.payload;
        actions.changeLocation(players, objects);
        return;
      }
      case "takenObj": {
        const { obj, player } = commit.payload;
        if (player == hero.name) return;
        actions.takenObj(obj);
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
