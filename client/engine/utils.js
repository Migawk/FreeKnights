import Player from "./player.js";
import LocationObject from "./object.js";

export const padding = 4;

export function wacky_round(number, places = 2) {
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
export function collision(object1, object2) {
  const collision = {
    xLeft: false,
    xRight: false,
    yTop: false,
    yBottom: false,
    isTouch: false,
  };
  // points
  const touch = true; //objDist < 30;

  const obj1Points = {
    x1: object1.x - object1.hitbox,
    x2: object1.x + object1.width + object1.hitbox,
    y1: object1.y - object1.hitbox,
    y2: object1.y + object1.width + object1.hitbox,
  };
  const obj2Points = {
    x1: object2.x - object2.hitbox,
    x2: object2.x + object2.width + object2.hitbox,
    y1: object2.y - object2.hitbox,
    y2: object2.y + object2.height + object2.hitbox,
  };
  if (touch && obj1Points.x1 < obj2Points.x2 && obj1Points.x1 > obj2Points.x1)
    collision.xLeft = true;
  if (touch && obj1Points.x2 > obj2Points.x1 && obj1Points.x2 < obj2Points.x2)
    collision.xRight = true;
  if (touch && obj1Points.y1 < obj2Points.y2 && obj1Points.y1 > obj2Points.y1)
    collision.yTop = true;
  if (touch && obj1Points.y2 > obj2Points.y1 && obj1Points.y2 < obj2Points.y2)
    collision.yBottom = true;

  if (
    (collision.xLeft && (collision.yTop || collision.yBottom)) ||
    (collision.xRight && (collision.yTop || collision.yBottom)) ||
    (collision.yTop && (collision.xLeft || collision.xRight)) ||
    (collision.yBottom && (collision.xLeft || collision.xRight))
  )
    collision.isTouch = true;

  const strength = 3;
  if (collision.isTouch) {
    if (collision.xLeft) {
      object1.vx += strength;
    }
    if (collision.xRight) {
      object1.vx -= strength;
    }
    if (collision.yTop) {
      object1.vy += strength;
    }
    if (collision.yBottom) {
      object1.vy -= strength;
    }
  }

  return collision;
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function radToDegree(rad) {
  return (rad * 180) / Math.PI;
}

export function generateUID() {
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

export class CommitActions {
  constructor(gameEntity, hero) {
    this.gameEntity = gameEntity;
    this.location = gameEntity.location;
    this.heroEntity = hero;
  }
  newUser(user) {
    const newUser = new Player(
      user.x,
      user.y,
      user.control,
      undefined,
      undefined,
      undefined,
      user.name,
      user.dialog
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
    if (!thePlayer || thePlayer.name == this.gameEntity.players[0].name) return;
    thePlayer.move(user.x, user.y);
    thePlayer.isRight = user.isRight;
    thePlayer.angleDirection = user.angleDirection;
  }
  newBullet(bullet) {
    const shooter = this.gameEntity.players.find(
      (player) => player.name == bullet.shooter
    );
    shooter.attack.shoot({ x: bullet.x2, y: bullet.y2 }, bullet.id);
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
        p.name,
        p.dialog
      );
    });
    this.gameEntity.players = [this.gameEntity.players[0], ...updatedList];
  }
  displayDialog(dialog) {
    this.gameEntity.message = { text: dialog[0].text, rest: dialog[0] };
    const listener = (e) => {
      if (e.key === "Enter") {
        if (!this.gameEntity.message.rest.tree) {
          this.gameEntity.message = null;
          this.heroEntity.isBusy = false;
          document.removeEventListener("keydown", listener);
          return;
        }
        this.gameEntity.message = {
          text: this.gameEntity.message.rest.tree[0].text,
          rest: this.gameEntity.message.rest.tree[0],
        };
      }
    };
    document.addEventListener("keydown", listener);
  }
  hit(location, player) {
    if (this.gameEntity.players[0].name === player.name) {
      socket.disconnect();
      return;
    }

    this.gameEntity.players = this.gameEntity.players.filter(
      (player1) => player1.name != player.name
    );
    this.location.objects = location.objects.map(
      (obj) =>
        new LocationObject(
          obj.x,
          obj.y,
          obj.width,
          obj.height,
          obj.img,
          obj.interaction,
          obj.id
        )
    );
  }
  changeLocation(players, objects) {
    this.userList(players);

    this.location.objects = objects.map(
      (obj) =>
        new LocationObject(
          obj.x,
          obj.y,
          obj.width,
          obj.height,
          obj.img,
          obj.interaction,
          obj.id
        )
    );
  }
  takenObj(obj) {
    const list = this.location.objects;

    list = list.filter((obj1) => obj1.id !== obj.id);
  }
}
