import { generateUID } from "./utils.js";
import { ctx } from "../script/main.js";

const arrow = new Image();
arrow.src = "./assets/arrow.png";

export default class Bullet {
  constructor(shooter, x1, y1, x2, y2, id, speed = 20) {
    this.id = id || generateUID();
    this.shooter = shooter;

    this.x = x1;
    this.y = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.hitbox = 1;

    this.speed = speed;
    this.angle = Math.atan2(y2 - y1, x2 - x1);
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);
    ctx.drawImage(arrow, 0, 0, 5, 24, 0, 0, 5, 24);
    ctx.restore();
  }
  update() {
    this.draw();
    this.move();
  }
  move() {
    this.x += this.speed * Math.cos(this.angle);
    this.y += this.speed * Math.sin(this.angle);
  }
}
