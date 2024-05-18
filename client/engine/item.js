export default class Item {
    constructor(name, count, maxCount, img, interaction, effect) {
        this.name = name;
        this.count = count;
        this.maxCount = maxCount;
        this.img = new Image();
        this.img.src = img;
        this.interaction = interaction;
        this.effect = effect;
    }
}