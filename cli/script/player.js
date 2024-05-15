const archer = document.getElementById("archer");

/**
 * @method
 * @name  move
 * @param {number} x
 * @param {number} y
 */
class Player {
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {"hero" | "player" | "npc"} control
   * @param {number} width
   * @param {number} height
   * @param {number} friction
   */
  constructor(
    x,
    y,
    control,
    width = 14,
    height = 13,
    friction = 0.9,
    name,
    dialog = null
  ) {
    this.name = name;
    this.isBusy = false;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.control = control;
    this.stamina = 0;
    this.hitbox = 2;

    this.vx = 0;
    this.vy = 0;
    this.acceleration = 0;
    this.friction = friction;
    this.limit = 5;
    this.isRight = false;
    this.aiming = false;

    this.arrows = [];
    this.messages = [];
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
      archer,
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

    /** Panel **/
    if (this.control === "hero" && !this.isBusy) {
      ctx.fillStyle = "#3c1003bb";
      ctx.save();
      ctx.translate(0, 400);
      ctx.fillRect(4, -54, 150, 50);
      ctx.translate(4, -54);
      const stamina =
        this.stamina > 125 ? 125 : this.stamina < 0 ? 0 : this.stamina;

      ctx.fillStyle = "#0a7326bb";
      ctx.fillRect(4, 4, 10, 20);
      ctx.fillStyle = "#260a73bb";
      ctx.fillRect(4, 26, stamina, 20);
      ctx.restore();
    }
  }
  update() {
    this.arrows.forEach((arrow) => {
      arrow.update();
    });
    if (keys.includes("aim")) {
      this.aiming = true;
    } else {
      this.aiming = false;
    }
    this.draw();
    this.move();
    if (keys.includes("aim") && keys.includes("shoot")) {
      keys.removeKey("shoot");
      const arrow = this.shoot(pointer);
      socket.emit("commit", { event: "newBullet", payload: arrow });
    }
  }
  move(x, y) {
    if (x && y) {
      this.x = x;
      this.y = y;
      return;
    }
    if (this.control != "hero") return;

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
      if (keys.includes("up")) {
        this.vy -= 2 * (this.aiming ? 0.33 : 1);
        this.vy -= this.acceleration;
      }
      if (keys.includes("down")) {
        this.vy += 2 * (this.aiming ? 0.33 : 1);
        this.vy += this.acceleration;
      }
      if (keys.includes("left")) {
        this.isRight = true;
        this.vx -= 2 * (this.aiming ? 0.33 : 1);
        this.vx -= this.acceleration;
      }
      if (keys.includes("right")) {
        this.isRight = false;
        this.vx += 2 * (this.aiming ? 0.33 : 1);
        this.vx += this.acceleration;
      }
    }

    this.stamina < 200 ? (this.stamina += 1) : null;
    if (keys.includes("shift") && keys.length > 1 && this.stamina > 0) {
      this.stamina -= 5;
      this.acceleration += 1; // FIX IT
    }
    if (this.stamina < 1) {
      keys.removeKey("shift");
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
  shoot(pointer, id) {
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
  }
  addMessage(content) {
    this.messages.push(content);
  }
  removeMessage(content) {
    this.messages = this.messages.filter((msg) => msg != content);
  }
}
