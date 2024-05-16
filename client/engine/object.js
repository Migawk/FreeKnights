import { ctx } from "../script/main.js";

export default class LocationObject {
  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   * @param {String} img
   * @param {function():void} interaction
   * @param {Number} sliceX
   * @param {Number} sliceY
   */
  constructor(x, y, width, height, img, interaction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.img = new Image();
    this.img.src = img;
    this.interaction = interaction;
    this.hitbox = 0;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.drawImage(this.img, 0, 0, this.width, this.height);
    ctx.restore();
  }
  update() {
    this.draw();
  }
}
