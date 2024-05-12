let keys = [];

keys.__proto__.removeKey = (keyName) => {
  keys = keys.filter((e) => e != keyName);
};

document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      if (keys.includes("up")) return;

      return keys.push("up");
    case "arrowleft":
    case "a":
      if (keys.includes("left")) return;
      return keys.push("left");
    case "arrowdown":
    case "s":
      if (keys.includes("down")) return;
      return keys.push("down");
    case "arrowright":
    case "d":
      if (keys.includes("right")) return;
      return keys.push("right");
    case "shift":
      if (keys.includes("shift")) return;
      return keys.push("shift");
    default:
      return;
  }
});
document.addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowup":
    case "w":
      return keys.removeKey("up");
    case "arrowleft":
    case "a":
      return keys.removeKey("left");
    case "arrowdown":
    case "s":
      return keys.removeKey("down");
    case "arrowright":
    case "d":
      return keys.removeKey("right");
    case "shift":
      return keys.removeKey("shift");
    default:
      return;
  }
});
