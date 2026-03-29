// ============================================
// CLASSES Exercises
// ============================================
// Complete the TODO exercises below
// Run with: node src/01-javascript/09-classes/exercises/classes.js

console.log('=== Exercise 1: Create a class ===');
// TODO: Create a class 'Rectangle' with width and height properties
// Add methods: area(), perimeter(), describe()
// describe() should return "Rectangle 4x6: area=24, perimeter=20"
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
  perimeter() {
    return 2 * (this.width + this.height);
  }
  describe() {
    return `Rectangle ${this.width}x${this.height}: area=${this.area()}, perimeter=${this.perimeter()}`;
  }
}
const rect = new Rectangle(4, 6);
console.log(rect.area()); // 24
console.log(rect.perimeter()); // 20
console.log(rect.describe());

console.log('\n=== Exercise 2: Constructor validation ===');
// TODO: Create a class 'Circle' where radius must be > 0
// Throw an error in the constructor if radius is invalid
class Circle {
  // Your code here
  constructor(radius) {
    if (radius <= 0) {
      throw new Error('Radius must be greater than 0');
    }
    this.radius = radius;
  }
}
// const c = new Circle(5);    // OK
// const bad = new Circle(-1); // Should throw

console.log('\n=== Exercise 3: Getters and setters ===');
// TODO: Create a 'Temperature' class that stores in Celsius
// Add getters: celsius, fahrenheit (C * 9/5 + 32), kelvin (C + 273.15)
// Add setter for celsius that validates >= -273.15
class Temperature {
  // Your code here
  #celsius;
  constructor(value) {
    this.celsius = value;
  }
  get celsius() {
    return this.#celsius;
  }
  set celsius(value) {
    if (value < -273.15) {
      throw new RangeError('Temperature cannot be below absolute zero');
    }
    this.#celsius = value;
  }
  get fahrenheit() {
    return (this.#celsius * 9) / 5 + 32;
  }
  get kelvin() {
    return this.#celsius + 273.15;
  }
  static fromFahrenheit(f) {
    return new Temperature(((f - 32) * 5) / 9);
  }
}
const t = new Temperature(15);
console.log(t.celsius); // 100
console.log(t.fahrenheit); // 212
console.log(t.kelvin); // 373.15

console.log('\n=== Exercise 4: Static methods ===');
// TODO: Add a static method 'fromFahrenheit(f)' to Temperature
// that creates a Temperature instance from Fahrenheit value
// fromFahrenheit(212) should create Temperature(100)
// Your code here (modify the Temperature class above or create new):
// Temperature.fromFahrenheit = function (f) {
//   return new Temperature(((f - 32) * 5) / 9);
// };
const test = Temperature.fromFahrenheit(212);
console.log(test.celsius); // 100

console.log('\n=== Exercise 5: Private fields ===');
// TODO: Create a 'Counter' class with a private #count field
// Methods: increment(), decrement(), reset(), getValue()
// #count should not be accessible from outside
class Counter {
  // Your code here
  #count = 0;
  increment() {
    this.#count++;
    return this;
  }
  decrement() {
    this.#count--;
    return this;
  }
  reset() {
    this.#count = 0;
    return this;
  }
  getValue() {
    return this.#count;
  }
}
const c = new Counter();
c.increment();
c.increment();
console.log(c.getValue()); // 2
// console.log(c.#count);     // SyntaxError (private)

console.log('\n=== Exercise 6: Inheritance ===');
// TODO: Create Animal base class with name and makeSound() method
// Create Dog and Cat subclasses that override makeSound()
// Dog: "Woof!" | Cat: "Meow!"
class Animal {
  // Your code here
  constructor(name) {
    this.name = name;
  }
  makeSound() {
    return `${this.name} makes a sound`;
  }
}
class Dog extends Animal {
  // Your code here
  makeSound() {
    return `${this.name} says: Woof!`;
  }
}
class Cat extends Animal {
  // Your code here
  makeSound() {
    return `${this.name} says: Meow!`;
  }
}
const dog = new Dog('Rex');
const cat = new Cat('Whiskers');
console.log(dog.makeSound()); // 'Rex says: Woof!'
console.log(cat.makeSound()); // 'Whiskers says: Meow!'

console.log('\n=== Exercise 7: super() in constructor ===');
// TODO: Create an Employee class extending Person
// Employee has: name, age (from Person), and role property
// Override toString() to include role
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  toString() {
    return `${this.name} (${this.age})`;
  }
}
class Employee extends Person {
  // Your code here
  constructor(name, age, role) {
    super(name, age);
    this.role = role;
  }
  toString() {
    return `${super.toString()} - ${this.role}`;
  }
}
const emp = new Employee('Alice', 30, 'Engineer');
console.log(emp.toString()); // 'Alice (30) - Engineer'
console.log(emp instanceof Person); // true

console.log('\n=== Exercise 8: instanceof check ===');
// TODO: Write a function that accepts any Shape (Circle or Rectangle)
// and returns a description based on its type
function describeShape(shape) {
  // use instanceof to check type
  if (shape instanceof Circle) {
    return `Circle with radius ${shape.radius}`;
  } else if (shape instanceof Rectangle) {
    return `Rectangle ${shape.width}x${shape.height}`;
  } else {
    return 'Unknown shape';
  }
}
console.log(describeShape(new Circle(5))); // 'Circle with radius 5'
console.log(describeShape(new Rectangle(4, 6))); // 'Rectangle 4x6'

console.log('\n=== 🎯 Challenge: Stack class ===');
// TODO: Implement a Stack (LIFO) data structure using a class
// Methods: push(item), pop(), peek(), isEmpty(), size
// Data should be private
class Stack {
  // Your code here
  #items = [];
  push(item) {
    this.#items.push(item);
    return this;
  }
  pop() {
    return this.#items.pop();
  }
  peek() {
    return this.#items[this.#items.length - 1];
  }
  isEmpty() {
    return this.#items.length === 0;
  }
  size() {
    return this.#items.length;
  }
}
const stack = new Stack();
stack.push(1).push(2).push(3);
console.log(stack.peek()); // 3
console.log(stack.pop()); // 3
console.log(stack.size()); // 2

console.log('\n=== 🎯 Challenge: EventEmitter class ===');
// TODO: Implement a simple EventEmitter
// Methods: on(event, callback), off(event, callback), emit(event, ...args)
class EventEmitter {
  // Your code here
  #events = {};
  on(event, callback) {
    if (!this.#events[event]) {
      this.#events[event] = [];
    }
    this.#events[event].push(callback);
    return this;
  }
  off(event, callback) {
    if (!this.#events[event]) return this;
    this.#events[event] = this.#events[event].filter((cb) => cb !== callback);
    return this;
  }
  emit(event, ...args) {
    if (!this.#events[event]) return this;
    this.#events[event].forEach((callback) => callback(...args));
    return this;
  }
}
const emitter = new EventEmitter();
const handler = (data) => console.log('Received:', data);
emitter.on('message', handler);
emitter.emit('message', 'Hello!'); // 'Received: Hello!'
emitter.off('message', handler);
emitter.emit('message', 'World'); // Nothing happens

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
