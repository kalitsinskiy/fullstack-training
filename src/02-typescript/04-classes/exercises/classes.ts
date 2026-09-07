export {};
// ============================================
// TYPESCRIPT CLASSES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: npx ts-node src/02-typescript/04-classes/exercises/classes.ts

console.log('=== Exercise 1: Basic typed class ===');
// TODO: Create a class 'BankAccount' with:
//   - readonly id: string
//   - owner: string (public)
//   - balance: number (private, starts at 0)
//   - Methods:
//     - deposit(amount: number): void — adds to balance (throw if amount <= 0)
//     - withdraw(amount: number): void — subtracts from balance (throw if insufficient)
//     - getBalance(): number — returns current balance

// Your code here:
class BankAccount {
  private balance: number;

  constructor(
    public readonly id: string,
    public owner: string,
  ) {
    this.balance = 0;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new RangeError('Amount cannot be negative or 0');
    }

    this.balance += amount;
  }

  withdraw(amount: number) {
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }

    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount('acc_1', 'Alice');
account.deposit(1000);
account.withdraw(250);
console.log(account.getBalance()); // 750
console.log(account.id, account.owner);

console.log('\n=== Exercise 2: Parameter properties ===');
// TODO: Rewrite the following class using TypeScript parameter property shorthand
// (move all property declarations into the constructor parameters)

class Person {
  name: string;
  age: number;
  private email: string;
  protected country: string;

  constructor(name: string, age: number, email: string, country: string) {
    this.name = name;
    this.age = age;
    this.email = email;
    this.country = country;
  }

  getEmail(): string {
    return this.email;
  }
}
const _personExample = new Person('Alice', 30, 'alice@example.com', 'UA');
console.log(
  'Person (before refactor):',
  _personExample.name,
  _personExample.getEmail(),
);

// Your refactored version:
class PersonV2 {
  constructor(
    public name: string,
    public age: number,
    private email: string,
    protected country: string,
  ) {}

  getEmail(): string {
    return this.email;
  }
}

// class PersonV2 { ... }
const p = new PersonV2('Alice', 30, 'alice@example.com', 'UA');
console.log('Person (after refactor):', p.name, p.getEmail());

console.log('\n=== Exercise 3: Inheritance + access modifiers ===');
// TODO: Create an abstract class 'Vehicle' with:
//   - protected speed: number (starts at 0)
//   - protected maxSpeed: number (set in constructor)
//   - abstract fuelType(): string
//   - accelerate(amount: number): void — increases speed, capped at maxSpeed
//   - brake(amount: number): void — decreases speed, minimum 0
//   - getSpeed(): number
// Then create two subclasses:
//   - 'ElectricCar' extends Vehicle — fuelType returns 'electric', maxSpeed 200
//   - 'GasCar' extends Vehicle — fuelType returns 'gasoline', maxSpeed 180

// Your code here:
abstract class Vechile {
  protected speed: number;

  constructor(protected maxSpeed: number) {
    this.speed = 0;
  }

  abstract fuelType(): string;

  accelerate(amount: number): void {
    const newSpeed = this.speed + amount;

    if (newSpeed < this.maxSpeed) {
      this.speed = newSpeed;
    } else {
      this.speed = this.maxSpeed;
    }
  }

  brake(amount: number): void {
    if (amount > this.speed) {
      this.speed = 0;
      return;
    }

    this.speed -= amount;
  }

  getSpeed(): number {
    return this.speed;
  }
}

class ElectricCar extends Vechile {
  constructor(maxSpeed = 200) {
    super(maxSpeed);
  }

  fuelType(): string {
    return 'electric';
  }
}

class GasCar extends Vechile {
  constructor(maxSpeed = 180) {
    super(maxSpeed);
  }

  fuelType(): string {
    return 'gasoline';
  }
}

const tesla = new ElectricCar();
tesla.accelerate(60);
tesla.accelerate(60);
console.log(tesla.getSpeed(), tesla.fuelType()); // 120 electric
tesla.brake(200); // capped at 0
console.log(tesla.getSpeed()); // 0

console.log('\n=== Exercise 4: Implement interface ===');
// TODO: Create an interface 'Logger' with:
//   - log(level: 'info' | 'warn' | 'error', message: string): void
//   - getLogs(): string[]
// Implement it in class 'ConsoleLogger' that:
//   - stores all log messages in a private array
//   - prefixes each message with the level: '[INFO] message', '[WARN] message', etc.
//   - console.logs each message when log() is called
//   - getLogs() returns all stored messages

// Your code here:
type LogLevel = 'info' | 'warn' | 'error';

interface Logger {
  log(level: LogLevel, message: string): void;
  getLogs(): string[];
}

class ConsoleLogger implements Logger {
  private logs: string[];

  constructor() {
    this.logs = [];
  }

  log(level: LogLevel, message: string): void {
    this.logs.push(`[${level.toUpperCase()}] ${message}`);
  }

  getLogs(): string[] {
    return this.logs;
  }
}

const logger = new ConsoleLogger();
logger.log('info', 'Server started');
logger.log('warn', 'High memory usage');
logger.log('error', 'Database connection failed');
console.log(logger.getLogs());

console.log('\n=== Exercise 5: Getters and setters ===');
// TODO: Create a class 'Circle' with:
//   - private _radius: number
//   - constructor(radius: number) — throws if radius <= 0
//   - getter 'radius': returns _radius
//   - setter 'radius': validates > 0 before setting
//   - getter 'area': returns PI * r²
//   - getter 'circumference': returns 2 * PI * r
//   - static method 'fromDiameter(d: number)': Circle — creates from diameter

// Your code here:
class Circle {
  private _radius: number;

  constructor(radius: number) {
    if (radius <= 0) throw new Error('Invalid radius');

    this._radius = radius;
  }

  get radius(): number {
    return this._radius;
  }

  set radius(value: number) {
    if (value <= 0) throw new Error('Invalid radius');

    this._radius = value;
  }

  get area(): number {
    return Math.PI * this._radius ** 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this._radius;
  }

  static fromDiameter(d: number): Circle {
    return new Circle(d / 2);
  }
}

const c = Circle.fromDiameter(10);
console.log(c.radius); // 5
console.log(c.area.toFixed(2)); // 78.54
console.log(c.circumference.toFixed(2)); // 31.42

console.log('\n=== Exercise 6: Generic class ===');
// TODO: Create a generic class 'Queue<T>' (FIFO — first in, first out):
//   - enqueue(item: T): void — adds to the end
//   - dequeue(): T | undefined — removes from the front
//   - peek(): T | undefined — returns front without removing
//   - readonly size: number
//   - isEmpty(): boolean
//   - toArray(): T[] — returns a copy of all items

// Your code here:
class Queue<T> {
  private items: T[] = [];

  get size(): number {
    return this.items.length;
  }

  enqueue(value: T): void | undefined {
    this.items.push(value);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  toArray(): T[] {
    return [...this.items];
  }
}

const queue = new Queue<string>();
queue.enqueue('first');
queue.enqueue('second');
queue.enqueue('third');
console.log(queue.peek()); // 'first'
console.log(queue.dequeue()); // 'first'
console.log(queue.size); // 2
console.log(queue.toArray()); // ['second', 'third']

console.log('\n=== 🎯 Challenge: Event Emitter ===');
// TODO: Create a type-safe event emitter:
//
// class EventEmitter<TEvents extends Record<string, unknown[]>> {
//   on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void
//   off<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void
//   emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void
// }
//
// Usage:
// type AppEvents = {
//   login: [userId: string, timestamp: Date];
//   logout: [userId: string];
//   error: [message: string, code: number];
// };
//
// const emitter = new EventEmitter<AppEvents>();
// emitter.on('login', (userId, timestamp) => {
//   console.log(`User ${userId} logged in at ${timestamp}`);
// });
// emitter.emit('login', 'user_1', new Date());

// Your code here:
class EventEmitter<TEvents extends Record<string, unknown[]>> {
  private listeners = new Map<keyof TEvents, Set<(...args: any[]) => void>>();

  on<K extends keyof TEvents>(
    event: K,
    listener: (...args: TEvents[K]) => void,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);
  }

  off<K extends keyof TEvents>(
    event: K,
    listener: (...args: TEvents[K]) => void,
  ): void {
    const eventListeners = this.listeners.get(event);

    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
    const eventListenters = this.listeners.get(event);
    if (eventListenters) {
      eventListenters.forEach((listener) => {
        listener(...args);
      });
    }
  }
}

// Usage:
type AppEvents = {
  login: [userId: string, timestamp: Date];
  logout: [userId: string];
  error: [message: string, code: number];
};

const emitter = new EventEmitter<AppEvents>();

emitter.on('login', (userId, timestamp) => {
  console.log(`User ${userId} logged in at ${timestamp.toISOString()}`);
});
emitter.emit('login', 'user_1', new Date());

emitter.on('logout', (id) => console.log(`Logged out: ${id}`));
emitter.emit('logout', 'user_1');

const errorHandler = (message: string, code: number): void =>
  console.log(`${code}: ${message}`);
emitter.on('error', errorHandler);
emitter.emit('error', 'User not Found', 404);
emitter.off('error', errorHandler);
emitter.emit('error', 'Bad Gateway', 502); // won't be called

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
