class Brain {
  constructor(inputsSize, hiddenSize, outputSize) {
    this.inputs = inputsSize;
    this.hiddens = hiddenSize;
    this.outputs = outputSize;

    this.weights1 = [];
    this.weights2 = [];
    this.bias = 1;
    this.learnc = 0.01;
  }
  initWeights(inSize, outSize) {
    let weights = [];
    for (let i = 0; i < inSize; i++) {
      weights[i] = [];
      for (let j = 0; j < outSize; j++) {
        weights[i][j] = Math.random();
      }
    }
    return weights;
  }
  random() {
    this.weights1 = this.initWeights(this.inputs, this.hiddens);
    this.weights2 = this.initWeights(this.hiddens, this.outputs);
  }

  train(inputs, desired, times = 1) {
    let guess = this.activate(inputs);
    let error = desired[0] - guess;
    

    if (error.toFixed(2) != 0) {
      for (let i = 0; i < inputs.length; i++) {
        for (let j = 0; j <= this.hiddens; j++) {
          this.weights1[i][j] += this.learnc * error * inputs[i];
        }
      }
    } else {
      return this;
    }
    if (times <= 1) {
      return this;
    }
    return this.train(inputs, desired, --times);
  }

  activate(inputs) {
    let sum = 0;
    for (let i = 0; i < inputs.length; i++) {
      for (let j = 0; j < inputs.length; j++) {
        sum += inputs[i] * this.weights1[i][j];
      }
    }
    return sum;
  }
}
const brain = new Brain(2, 2, 1);

brain.random();
brain.train([0, 0], [0], 100);
brain.train([0, 1], [1], 100);
brain.train([1, 1], [0], 100);

console.log(brain.activate([1, 1]));
