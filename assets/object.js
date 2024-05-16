export default class LocationObject {
  /**
   *
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   * @param {String} img
   * @param {Array} interaction
   */
  constructor(x, y, width, height, img, interaction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.img = img;
    this.interaction = interaction;
  }
}
