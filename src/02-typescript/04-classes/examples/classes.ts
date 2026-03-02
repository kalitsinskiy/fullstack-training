export {};
// ============================================
// TYPESCRIPT CLASSES Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/04-classes/examples/classes.ts

console.log('=== 1. Basic typed class ===');

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distanceTo(other: Point): number {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
console.log('p1:', p1.toString());
console.log('p2:', p2.toString());
console.log('Distance:', p1.distanceTo(p2)); // 5


console.log('\n=== 2. Parameter properties (shorthand) ===');

class User {
  constructor(
    public readonly id: string,
    public name: string,
    private email: string,
    protected role: string = 'user',
  ) {}

  getEmail(): string {
    return this.email; // private — only accessible inside the class
  }

  describe(): string {
    return `${this.name} (${this.role})`;
  }
}

const user = new User('u1', 'Alice', 'alice@example.com');
console.log('User:', user.describe());
console.log('Email (via method):', user.getEmail());
console.log('ID:', user.id);
// console.log(user.email);  // ❌ Property 'email' is private


console.log('\n=== 3. Access modifiers + inheritance ===');

class Employee extends User {
  constructor(
    id: string,
    name: string,
    email: string,
    private department: string,
  ) {
    super(id, name, email, 'employee');
  }

  describe(): string {
    // Can access 'role' (protected), but not 'email' (private to User)
    return `${this.name} — ${this.department} (${this.role})`;
  }
}

const emp = new Employee('e1', 'Bob', 'bob@co.com', 'Engineering');
console.log('Employee:', emp.describe());


console.log('\n=== 4. Getters and Setters ===');

class Temperature {
  private _celsius: number;

  constructor(celsius: number) {
    this._celsius = celsius;
  }

  get celsius(): number {
    return this._celsius;
  }

  set celsius(value: number) {
    if (value < -273.15) throw new Error('Below absolute zero!');
    this._celsius = value;
  }

  get fahrenheit(): number {
    return (this._celsius * 9) / 5 + 32;
  }

  set fahrenheit(value: number) {
    this.celsius = ((value - 32) * 5) / 9;
  }
}

const temp = new Temperature(100);
console.log('Celsius:', temp.celsius);
console.log('Fahrenheit:', temp.fahrenheit); // 212

temp.fahrenheit = 32;
console.log('After setting 32°F → Celsius:', temp.celsius); // 0


console.log('\n=== 5. Implementing interfaces ===');

interface Serializable {
  serialize(): string;
}

interface Validatable {
  validate(): boolean;
}

class Product implements Serializable, Validatable {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
  ) {}

  validate(): boolean {
    return this.name.length > 0 && this.price > 0;
  }

  serialize(): string {
    return JSON.stringify({ id: this.id, name: this.name, price: this.price });
  }
}

const product = new Product('p1', 'Laptop', 999);
console.log('Valid:', product.validate());
console.log('Serialized:', product.serialize());


console.log('\n=== 6. Abstract classes ===');

abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  // Concrete method available to all subclasses
  describe(): string {
    return `Area: ${this.area().toFixed(2)}, Perimeter: ${this.perimeter().toFixed(2)}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }
  area(): number { return this.width * this.height; }
  perimeter(): number { return 2 * (this.width + this.height); }
}

const circle = new Circle(5);
const rect = new Rectangle(4, 6);

console.log('Circle:', circle.describe());
console.log('Rectangle:', rect.describe());

// Polymorphism — treat all shapes the same
const shapes: Shape[] = [circle, rect, new Circle(3)];
const totalArea = shapes.reduce((sum, s) => sum + s.area(), 0);
console.log('Total area:', totalArea.toFixed(2));

// const s = new Shape(); // ❌ Cannot create an instance of an abstract class


console.log('\n=== 7. Static members ===');

class MathUtils {
  static readonly PI = 3.14159265;

  static circleArea(radius: number): number {
    return MathUtils.PI * radius ** 2;
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}

console.log('PI:', MathUtils.PI);
console.log('Circle area(5):', MathUtils.circleArea(5).toFixed(2));
console.log('Clamp(15, 0, 10):', MathUtils.clamp(15, 0, 10)); // 10


console.log('\n=== 8. Generic class ===');

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.push(3);
console.log('Peek:', numStack.peek()); // 3
console.log('Pop:', numStack.pop());   // 3
console.log('Size:', numStack.size);   // 2

const strStack = new Stack<string>();
strStack.push('hello');
strStack.push('world');
console.log('String stack:', strStack.pop()); // 'world'

console.log('\n✅ TypeScript classes examples complete!');
