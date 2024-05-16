function wacky_round(number, places = 2) {
  var multiplier = Math.pow(10, places + 2);
  var fixed = Math.floor(number * multiplier);
  fixed += 44;
  fixed = Math.floor(fixed / 100);
  return fixed / Math.pow(10, places);
}

export default class Player {
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
    friction = 1,
    name,
    dialog = null
  ) {
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
    if (control == "npc" && dialog) this.dialog = dialog;
  }
}
