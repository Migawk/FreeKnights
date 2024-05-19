import { ctx } from "../script/main.js";
import { generateUID } from "./utils.js";

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
  constructor(x, y, width, height, img, interaction, id) {
    this.id = id || generateUID();

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.img = img;
    this.imgBody = new Image();
    this.imgBody.src = img;
    this.interaction = interaction;
    this.hitbox = 0;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.drawImage(this.imgBody, 0, 0, this.width, this.height);
    ctx.restore();
  }
  update() {
    this.draw();
  }
}
