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
   * @param {string} name
   * @param {array} dialog
   * @param {"archer" | "knight" | "wizard" | "rogue"} character
   * @param {number} hp
   * @param {array} inventory
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
    inventory = []
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
    this.inventory = inventory;
    if (this.inventory.length) {
      this.selectedItem = 0;
    } else {
      this.selectedItem = null;
    }
    this.abilities = [];

    this.img = "./assets/archer.png";

    if (control == "npc" && dialog) this.dialog = dialog;
  }
}
