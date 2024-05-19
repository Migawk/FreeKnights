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
    this.interaction = interaction;
    this.hitbox = 0;
  }
}
