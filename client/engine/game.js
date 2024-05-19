import { crosshair, ctx, pointer } from "../script/main.js";
import keys from "./keys.js";
import { collision, distance, padding } from "./utils.js";

const interaction = new Image(20, 20);
interaction.src = "../assets/interaction.png";
const poison = new Image();
const poison2 = new Image();
const poison3 = new Image();
const poison4 = new Image();
poison.src = "../assets/poison1.png";
poison2.src = "../assets/poison2.png";
poison3.src = "../assets/poison3.png";
poison4.src = "../assets/poison4.png";

export const imgs = {
  "interaction.png": interaction,
  "poison.png": poison,
  "poison2.png": poison2,
  "poison3.png": poison3,
  "poison4.png": poison4,
};

export default class Game {
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
        const dist = distance(arrow.x, arrow.y, player.x, player.y);
        if (dist < 25) {
          player.arrows = player.arrows.filter((arrow1) => arrow != arrow1);
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

    if (keys.has("aim") && player.stamina < 10) {
      keys.delete("aim");
    }
    if (keys.has("aim") && player.stamina > 10) {
      ctx.drawImage(crosshair, pointer.x + 16, pointer.y + 16);

      ctx.strokeStyle = "red";
      ctx.strokeWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(pointer.x + crosshair.width, pointer.y + crosshair.width);
      ctx.stroke();
      ctx.fill();

      player.stamina -= 0.8;
    }
    if (keys.has("aim") && keys.has("shoot") && player.stamina > 10) {
      player.stamina -= 10;
      keys.delete("shoot");
      const arrow = player.attack.shoot(pointer);
      socket.emit("commit", { event: "newBullet", payload: arrow });
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
      ctx.translate(0, 346);
      ctx.fillRect(padding, 0, 150, 50);
      ctx.translate(padding, 0);
      const hp = player.hp > length ? length : player.hp < 0 ? 0 : player.hp;
      const stamina =
        player.stamina > length
          ? length
          : player.stamina < 0
          ? 0
          : player.stamina;

      ctx.fillStyle = "#0a7326bb";
      ctx.fillRect(padding, padding, hp, 20);
      ctx.fillStyle = "#260a73bb";
      ctx.fillRect(padding, 26, stamina, 20);
      ctx.restore();

      /** Inventory **/
      ctx.save();
      ctx.translate(0, canvas.height - 30);
      ctx.translate(padding + 150 + padding, 0);
      if (player.inventory.length > 0) {
        if (!player.selectedItem) player.selectedItem = 0;

        for (let i = 0; i <= player.inventory.length; i++) {
          if (player.inventory[i]) {
            if (player.selectedItem === i) {
              ctx.fillStyle = "#263c03bb";
            } else {
              ctx.fillStyle = "#3c1003bb";
            }
            ctx.fillRect(padding, 0 - padding, 30, 30);

            ctx.drawImage(
              imgs[player.inventory[i].img],
              padding * 3,
              padding,
              32 - padding * 4,
              32 - padding * 4
            );
            ctx.fillStyle = "#620606";
            ctx.font = "bold 16px Arial";
            ctx.fillText(i+1, 15, 30);
            ctx.translate(30 + padding, 0);
          }
        }
      }
      ctx.restore();

      /** Abilities */
      ctx.save();
      ctx.translate(canvas.width - 40, canvas.height - 40);
      for (let i = 0; i <= player.abilities.length; i++) {
        ctx.fillRect(-padding, 0 - padding, 40, 40);
        ctx.translate(-40 - padding, 0);
      }
      ctx.restore();
    }
    if (player.effects.size > 0) {
      ctx.save();
      ctx.translate(padding, padding);

      player.effects.forEach((_, effect) => {
        ctx.fillStyle = "#3c1003bb";
        ctx.fillRect(0, 0, padding * 6, padding * 6);
        ctx.beginPath();

        switch (effect) {
          case "regen": {
            ctx.strokeStyle = "#0a7326bb";
            ctx.lineWidth = 4;

            ctx.moveTo(padding, padding * 3);
            ctx.lineTo(padding * 5, padding * 3);
            ctx.moveTo(padding * 3, padding);
            ctx.lineTo(padding * 3, padding * 5);
            ctx.stroke();
            break;
          }
          case "stamina": {
            ctx.strokeStyle = "#260a73";
            ctx.lineWidth = 3;
            ctx.moveTo(padding * 4, padding * 1);
            ctx.lineTo(padding * 2, padding * 3);
            ctx.lineTo(padding * 4, padding * 3);
            ctx.lineTo(padding * 2, padding * 5);

            ctx.stroke();
            break;
          }
          case "acceleration": {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            
            ctx.moveTo(padding*1.5, padding);
            ctx.lineTo(padding*1.5, padding*5);
            ctx.lineTo(padding*4.5, padding*5);
            ctx.lineTo(padding*4.5, padding*3.5);
            ctx.lineTo(padding*2.5, padding*3.5);
            ctx.lineTo(padding*2.5, padding);
            ctx.lineTo(padding*1.4, padding);
            ctx.stroke();
          }
        }

        ctx.translate(0, padding * 7);
      });
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
      ctx.scale(0.5, 0.5);
      ctx.beginPath();
      ctx.arc(-4, -34, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.drawImage(interaction, -16, -48);
      ctx.restore();
    }
  }
}
