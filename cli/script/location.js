const locations = new Map();
locations.set("tovern", {
  name: "tovern",
  floor: "./assets/tovern.png",
  borderColor: "#914f33",
});
locations.set("valley", {
  name: "valley",
  floor: "./assets/grass.png",
  borderColor: "#4dcd00",
});

class Location {
  constructor() {
    this.currentLocation = locations.get("tovern");
    this.img = new Image();
    this.img.src = this.currentLocation.floor;
  }
  change(name) {
    const newLocation = locations.get(name);
    if (!location) return;
    this.currentLocation = newLocation;
    this.img.src = newLocation.floor;

    socket.emit("commit", {
      event: "changeLocation",
      payload: newLocation,
    });
  }
  draw() {
    ctx.save();

    const ptrn = ctx.createPattern(this.img, "repeat");
    ctx.fillStyle = ptrn;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  }
  update() {
    this.draw();
  }
}