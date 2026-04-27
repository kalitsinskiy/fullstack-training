// Object.prototype
Array.prototype.random = function () {
  const index = Math.floor(Math.random() * this.length);
  return this[index];
};

const emojis = ['🔥', '⚡', '🌈'];
console.log(emojis.random()); // Виведе випадковий емодзі
