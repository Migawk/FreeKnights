import keys from "./keys.js";

document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      if (keys.has("up")) return;

      return keys.add("up");
    case "arrowleft":
    case "a":
      if (keys.has("left")) return;
      return keys.add("left");
    case "arrowdown":
    case "s":
      if (keys.has("down")) return;
      return keys.add("down");
    case "arrowright":
    case "d":
      if (keys.has("right")) return;
      return keys.add("right");
    case "shift":
      if (keys.has("shift")) return;
      return keys.add("shift");
    default:
      return;
  }
});
document.addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      return keys.delete("up");
    case "arrowleft":
    case "a":
      return keys.delete("left");
    case "arrowdown":
    case "s":
      return keys.delete("down");
    case "arrowright":
    case "d":
      return keys.delete("right");
    case "shift":
      return keys.delete("shift");
    default:
      return;
  }
});
