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
  constructor(x, y, control, width = 14, height = 13, friction = 1, name) {
    this.name = name;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.control = control;
    this.stamina = 100;
    this.hitbox = 10;

    this.speed = 0;
    this.acceleration = 0;
    this.angleDirection = 0;
    this.friction = friction;
    this.limit = 5;
    this.isRight = Math.abs(wacky_round(this.angleDirection) - Math.PI);
    this.aiming = false;

    this.arrows = [];
    this.messages = [];
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.font = "12px Arial";
    const { width: nameWidth } = ctx.measureText(this.name);
    ctx.fillText(this.name, -nameWidth / 2, -16);
    ctx.scale(this.isRight < 2 ? -2 : 2, 2);

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
    if (this.messages.length == 0) return;
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
  update() {
    this.arrows.forEach((arrow) => {
      arrow.update();
    });
    if (keys.includes("aim")) {
      this.aiming = true;
    } else {
      this.aiming = false;
    }
    this.isRight = Math.abs(wacky_round(this.angleDirection) - Math.PI);
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

    this.angleDirection %= Math.PI * 2;

    if (this.acceleration != 0) {
      if (this.acceleration < 0) {
        this.acceleration += this.friction;
      } else {
        this.acceleration -= this.friction;
      }
    }
    if (this.speed != 0) {
      if (this.speed < 0) {
        this.speed += this.friction;
      } else {
        this.speed -= this.friction;
      }
      if (Math.round(this.speed.toFixed(1)) == 0) this.speed = 0;
    }
    if (Math.abs(this.speed) > this.limit) {
      this.speed < 0 ? (this.speed = -this.limit) : (this.speed = this.limit);
    }

    if (
      keys.includes("up") ||
      keys.includes("left") ||
      keys.includes("down") ||
      keys.includes("right")
    )
      this.speed += 2 * (this.aiming ? 0.33 : 1);
    if (keys.includes("shift") && keys.length > 1 && this.stamina > 10) {
      this.stamina -= 5;
      this.acceleration += 1;
    } else {
      this.stamina < 200 ? (this.stamina += 1) : null;
    }

    if (keys.includes("right")) {
      this.angleDirection = 0;
    }
    if (keys.includes("left")) {
      this.angleDirection = Math.PI;
    }
    if (keys.includes("up")) {
      this.angleDirection = (3 * Math.PI) / 2;
    }
    if (keys.includes("down")) {
      this.angleDirection = Math.PI / 2;
    }
    this.speed += this.acceleration;

    this.x += this.speed * Math.cos(this.angleDirection);
    this.y += this.speed * Math.sin(this.angleDirection);

    if (this.x < this.width) this.x = this.width;
    if (this.y < 0) this.y = 0;

    if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    if (this.y > canvas.height - this.height)
      this.y = canvas.height - this.height;
    if (this.speed || this.acceleration) {
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
