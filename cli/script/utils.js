const padding = 4;
function wacky_round(number, places = 2) {
  var multiplier = Math.pow(10, places + 2); // get two extra digits
  var fixed = Math.floor(number * multiplier); // convert to integer
  fixed += 44; // round down on anything less than x.xxx56
  fixed = Math.floor(fixed / 100); // chop off last 2 digits
  return fixed / Math.pow(10, places);
}

/**
 *
 * @param {Player} object1
 * @param {Player} object2
 */
function collision(object1, object2) {
  const collision = {
    xLeft: false,
    xRight: false,
    yTop: false,
    yBottom: false,
    isTouch: false,
  };
  const touch = distance(object1.x, object1.y, object2.x, object2.y) < 30;

  if (touch && object2.hitbox + object2.x + object2.width >= object1.x)
    collision.xLeft = true;
  if (touch && object1.hitbox + object1.x + object1.width >= object2.x)
    collision.xRight = true;
  if (touch && object2.hitbox + object2.y + object2.height >= object1.y)
    collision.yTop = true;
  if (touch && object1.hitbox + object1.y + object1.height >= object2.y)
    collision.yBottom = true;

  if (
    collision.xLeft ||
    collision.xRight ||
    collision.yTop ||
    collision.yBottom
  )
    collision.isTouch = true;

  return collision;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function radToDegree(rad) {
  return (rad * 180) / Math.PI;
}

class CommitActions {
  constructor(gameEntity) {
    this.gameEntity = gameEntity;
  }
  newUser(user) {
    const newUser = new Player(
      user.x,
      user.y,
      "player",
      undefined,
      undefined,
      undefined,
      user.name
    );
    const newList = this.gameEntity.players;
    newList.push(newUser);
    this.gameEntity.updatePlayers(newList);
  }
  leaveUser(user) {
    const newList = this.gameEntity.players.filter(
      (player) => player.name != user.name
    );
    this.gameEntity.updatePlayers(newList);
  }
  movement(user) {
    const thePlayer = this.gameEntity.players.find((p) => p.name === user.name);
    if (!thePlayer) return;
    thePlayer.move(user.x, user.y);
    thePlayer.isRight = user.isRight;
    thePlayer.angleDirection = user.angleDirection;
  }
  newBullet(bullet) {
    const shooter = this.gameEntity.players.find(
      (player) => player.name == bullet.shooter
    );
    shooter.shoot({ x: bullet.x2, y: bullet.y2 }, bullet.id);
  }
  leaveBullet(bullet) {
    const shooter = this.gameEntity.players.find(
      (player) => player.name == bullet.shooter
    );
    shooter.arrows = shooter.arrows.filter((e) => e.id != bullet.id);
  }
  addMessage(author, content) {
    const authorEntity = this.gameEntity.players.find(
      (player) => player.name == author
    );
    if (!authorEntity) return;
    authorEntity.addMessage(content);
  }
  removeMessage(author, content) {
    const authorEntity = this.gameEntity.players.find(
      (player) => player.name == author
    );
    if (!authorEntity) return;
    authorEntity.removeMessage(content);
  }
  userList(newList) {
    const updatedList = newList.map((p) => {
      return new Player(
        p.x,
        p.y,
        p.control == "hero" ? "player" : p.control,
        p.width,
        p.height,
        p.friction,
        p.name
      );
    });
    console.log(updatedList);
    this.gameEntity.players = [this.gameEntity.players[0], ...updatedList];
  }
}
function generateUID() {
  // Creates a random 4-character string
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  // Returns a concatenated string of four random strings
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
}
