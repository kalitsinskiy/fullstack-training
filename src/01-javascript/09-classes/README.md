# Classes in JavaScript

## Quick Overview

Classes are blueprints for creating objects. They are syntactic sugar over JavaScript's prototype-based inheritance — introduced in ES6.

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound.`);
  }
}

const dog = new Animal('Rex');
dog.speak(); // 'Rex makes a sound.'
```

## Key Concepts

### Class Basics

```javascript
class Person {
  // Private fields (ES2022)
  #age;

  constructor(name, age) {
    this.name = name; // public
    this.#age = age;  // private
  }

  // Method
  greet() {
    return `Hi, I'm ${this.name}`;
  }

  // Getter
  get age() { return this.#age; }
  set age(value) {
    if (value < 0) throw new RangeError('Age cannot be negative');
    this.#age = value;
  }

  // Static method (on class, not instance)
  static create(name) {
    return new Person(name, 0);
  }
}
```

### Inheritance

```javascript
class Employee extends Person {
  constructor(name, age, role) {
    super(name, age); // must call super first!
    this.role = role;
  }

  greet() {
    return `${super.greet()}, I'm a ${this.role}`;
  }
}
```

### Key Rules

- `constructor()` — called when `new ClassName()` is used
- `super()` — must be called in child constructor before `this`
- `static` — belongs to class, not instances
- `#field` — private (only accessible inside class)
- `get`/`set` — computed properties

## Learn More

- [MDN: Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [JavaScript.info: Classes](https://javascript.info/classes)
- [MDN: extends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends)
- [JavaScript.info: Class inheritance](https://javascript.info/class-inheritance)

## How to Work

1. **Study examples**: Run `node src/01-javascript/09-classes/examples/<file>.js`
2. **Complete exercises**: Open `exercises/classes.js` and write code

