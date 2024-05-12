const locations = [
  {
    name: "tovern",
    floor: "./assets/tovern.png",
    borderColor: 0x914f33,
  },
];

class Location {
  constructor() {
    this.currentLocation = locations[0];
  }
  changeLocation(id) {
    this.currentLocation = locations[id];
  }
  draw() {
    ctx.save();
    
    const img = new Image();
    img.src = this.currentLocation.floor

    const ptrn = ctx.createPattern(img, "repeat");
    ctx.fillStyle = ptrn;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
  }
  update() {
    this.draw();
  }
}
