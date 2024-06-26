import keys from "./keys.js";
import { ctx, pointer } from "../script/main.js";
import Bullet from "./bullet.js";

/**
 * @method
 * @name  move
 * @param {number} x
 * @param {number} y
 */
export default class Player {
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {"hero" | "player" | "npc"} control
   * @param {number} width
   * @param {number} height
   * @param {number} friction
   * @param {string} name
   * @param {array} dialog
   * @param {"archer" | "knight" | "wizard" | "rogue"} character
   * @param {number} hp
   * @param {array} inventory
   * @param {Map<String, Object>} effects
   */
  constructor(
    x,
    y,
    control,
    width = 14,
    height = 13,
    friction = 0.9,
    name,
    dialog = null,
    character,
    hp,
    inventory = [],
    effects = new Map()
  ) {
    this.name = name;
    this.isBusy = false;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.control = control;
    this.hp = hp;
    this.stamina = 0;
    this.hitbox = 2;

    this.vx = 0;
    this.vy = 0;
    this.acceleration = 0;
    this.friction = friction;
    this.limit = 5;
    this.isRight = false;
    this.aiming = false;
    this.character = character;

    this.arrows = [];
    this.messages = [];
    this.abilities = [];
    this.effects = effects;
    this.inventory = inventory;
    if (this.inventory.length) {
      this.selectedItem = 0;
    } else {
      this.selectedItem = null;
    }

    this.img = new Image();
    this.img.src = "./assets/archer.png";

    if (control == "npc" && dialog) this.dialog = dialog;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.font = "bold 12px Arial";
    const { width: nameWidth } = ctx.measureText(this.name);
    ctx.fillText(this.name, -nameWidth / 2, -16);
    ctx.scale(this.isRight ? -2 : 2, 2);

    ctx.drawImage(
      this.img,
      0,
      0,
      this.width,
      this.height,
      -6,
      -6,
      this.width,
      this.height
    );
    ctx.restore();

    /**  MESSAGE **/
    if (this.messages.length != 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.font = "16px Arial";

      [...this.messages].reverse().forEach((msg, ind) => {
        const { width: contentWidth } = ctx.measureText(msg);
        const basicGap = 24;

        ctx.fillStyle = "#ccc";
        ctx.fillRect(
          -contentWidth / 2 - 3,
          -basicGap - basicGap * (ind + 1),
          contentWidth + 6,
          24
        );
        ctx.fillStyle = "#111";
        ctx.fillText(msg, -contentWidth / 2, -basicGap * (ind + 1) - 6);
      });
      ctx.restore();
    }
  }
  update() {
    this.arrows.forEach((arrow) => {
      arrow.update();
    });
    if (keys.has("aim")) {
      this.aiming = true;
    } else {
      this.aiming = false;
    }

    /** Effects **/
    if (this.effects.has("regen")) {
      let { quant, time } = this.effects.get("regen");
      this.hp += quant;

      if (time.toFixed(1) <= 0) return this.effects.delete("regen");

      this.effects.set("regen", { quant, time: (time -= 0.1) });
    }
    if (this.effects.has("stamina")) {
      let { quant, time } = this.effects.get("stamina");
      this.stamina += quant;

      if (time.toFixed(1) <= 0) return this.effects.delete("stamina");

      this.effects.set("stamina", { quant, time: (time -= 0.1) });
    }
    if (this.effects.has("acceleration")) {
      let { quant, time } = this.effects.get("acceleration");
      this.acceleration += quant;

      if (time.toFixed(1) <= 0) return this.effects.delete("acceleration");

      this.effects.set("acceleration", { quant, time: (time -= 0.1) });
    }

    this.draw();
    this.move();

    if (this.acceleration != 0) {
      if (this.acceleration < 0) {
        this.acceleration += this.friction;
      } else {
        this.acceleration -= this.friction;
      }
    }
    if (this.vx != 0 || this.vy != 0) {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.acceleration *= this.friction;
    }
  }
  move(x, y) {
    if (x && y) {
      this.x = x;
      this.y = y;
      return;
    }
    if (this.control != "hero") return;

    if (Math.abs(this.vx) >= this.limit) {
      if (this.vx < 0) this.vx = -this.limit;
      else this.vx = this.limit;
    }
    if (Math.abs(this.vy) >= this.limit) {
      if (this.vy < 0) this.vy = -this.limit;
      else this.vy = this.limit;
    }

    if (Math.round(this.vx.toFixed(2)) == 0) this.vx = 0;
    if (Math.round(this.vy.toFixed(2)) == 0) this.vy = 0;
    if (Math.round(this.acceleration.toFixed(3)) == 0) this.acceleration = 0;

    if (!this.isBusy) {
      if (keys.has("up")) {
        this.vy -= 2 * (this.aiming ? 0.33 : 1);
        this.vy -= this.acceleration;
      }
      if (keys.has("down")) {
        this.vy += 2 * (this.aiming ? 0.33 : 1);
        this.vy += this.acceleration;
      }
      if (keys.has("left")) {
        this.isRight = true;
        this.vx -= 2 * (this.aiming ? 0.33 : 1);
        this.vx -= this.acceleration;
      }
      if (keys.has("right")) {
        this.isRight = false;
        this.vx += 2 * (this.aiming ? 0.33 : 1);
        this.vx += this.acceleration;
      }
    }

    this.stamina < 200 ? (this.stamina += 4) : null;

    if (keys.has("shift") && keys.size > 1 && this.stamina > 0) {
      this.stamina -= 5;
      this.acceleration += 1.5;
    }
    if (this.stamina < 1) {
      keys.delete("shift");
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.width) this.x = this.width;
    if (this.y < 0) this.y = 0;

    if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    if (this.y > canvas.height - this.height)
      this.y = canvas.height - this.height;
    if (this.vx || this.vy || this.acceleration) {
      socket.emit("commit", { event: "movement", payload: this });
    }
  }
  attack = {
    shoot: (pointer, id) => {
      const arrow = new Bullet(
        this.name,
        this.x,
        this.y,
        pointer.x,
        pointer.y,
        id
      );
      this.arrows.push(arrow);

      setTimeout(() => {
        this.arrows = this.arrows.filter((lArrow) => lArrow.name != arrow);
        socket.emit("commit", { event: "leaveBullet", payload: arrow });
      }, 1000);
      return arrow;
    },
    melee: (pointer) => {
      socket.emit("commit", {
        event: "melee",
        payload: {
          weapon: this.selectedItem,
          coords: {
            x: pointer.x,
            y: pointer.y,
          },
        },
      });
    },
  };
  addMessage(content) {
    this.messages.push(content);
  }
  removeMessage(content) {
    this.messages = this.messages.filter((msg) => msg != content);
  }
}
