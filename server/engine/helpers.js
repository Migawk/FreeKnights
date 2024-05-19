import LocationObject from "./object.js";
import Item from "./item.js";

export function spawnObjectAfterDead(player) {
  let item;
  const dices = Math.round(Math.random() * 6) + Math.round(Math.random() * 6);
  if (dices < 4) {
    item = new Item("Heal", 1, 2, "poison.png", "heal");
  } else if (dices < 8 && dices > 4) {
    item = new Item("Stamina", 1, 2, "poison2.png", "stamina");
  } else {
    item = new Item("Acceleration", 1, 2, "poison3.png", "acceleration");
  }
  return new LocationObject(
    player.x,
    player.y,
    10,
    10,
    "./assets/" + item.img,
    ["item", item]
  );
  if (Math.random() < 0.5) {
    let item;
    const dices = Math.round(Math.random() * 6) + Math.round(Math.random() * 6);
    if (dices < 4) {
      item = new Item("Heal", 1, 2, "poison.png", "heal");
    } else if (dices < 8 && dices > 4) {
      item = new Item("Stamina", 1, 2, "poison2.png", "stamina");
    } else {
      item = new Item("Acceleration", 1, 2, "poison3.png", "acceleration");
    }

    return new LocationObject(
      player.x,
      player.y,
      10,
      10,
      "./assets/" + item.img,
      ["item", item]
    );
  }
}
