export {};
// ============================================
// INTERFACES Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/02-interfaces/examples/interfaces.ts

console.log('=== 1. Basic interface ===');

interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = { id: 1, name: 'Alice', email: 'alice@example.com' };
console.log('User:', user);

// TypeScript catches missing or extra fields:
// const bad: User = { id: 2, name: 'Bob' }; // ❌ missing email
// const bad2: User = { id: 2, name: 'Bob', email: '', age: 30 }; // ❌ extra field


console.log('\n=== 2. Optional and readonly ===');

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;  // optional
  readonly sku: string;  // cannot change after creation
}

const laptop: Product = { id: 1, name: 'Laptop', price: 999, sku: 'LPT-001' };
console.log('Laptop:', laptop);
console.log('Description:', laptop.description); // undefined

laptop.price = 899; // ✅ price can change
// laptop.sku = 'NEW'; // ❌ Cannot assign to 'sku' because it is a read-only property


console.log('\n=== 3. Extending interfaces ===');

interface Animal {
  name: string;
  sound: () => string;
}

interface Pet extends Animal {
  owner: string;
}

interface Dog extends Pet {
  breed: string;
}

const myDog: Dog = {
  name: 'Rex',
  sound: () => 'Woof',
  owner: 'Alice',
  breed: 'Labrador',
};
console.log(`${myDog.name} says ${myDog.sound()}, owner: ${myDog.owner}`);

// Multiple extends
interface Flyable { fly(): void }
interface Swimmable { swim(): void }
interface Duck extends Animal, Flyable, Swimmable {}

const duck: Duck = {
  name: 'Donald',
  sound: () => 'Quack',
  fly: () => console.log('Flying'),
  swim: () => console.log('Swimming'),
};
duck.fly();
duck.swim();


console.log('\n=== 4. Interface with methods ===');

interface Calculator {
  value: number;
  add(n: number): Calculator;   // method
  subtract(n: number): Calculator;
  result(): number;
}

const calc: Calculator = {
  value: 0,
  add(n) { return { ...this, value: this.value + n }; },
  subtract(n) { return { ...this, value: this.value - n }; },
  result() { return this.value; },
};

const result = calc.add(10).add(5).subtract(3).result();
console.log('Calculator result:', result); // 12


console.log('\n=== 5. Index signature ===');

interface StringMap {
  [key: string]: string;
}

const headers: StringMap = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer xyz',
  Accept: 'application/json',
};
console.log('Content-Type:', headers['Content-Type']);

interface NumberMap {
  [key: string]: number;
  length: number; // specific key must be assignable to index type
}
const rateLimits: NumberMap = { 'X-RateLimit-Limit': 100, 'X-RateLimit-Remaining': 50, length: 2 };
console.log('Rate limit:', rateLimits['X-RateLimit-Limit']);


console.log('\n=== 6. Implementing interface in class ===');

interface Serializable {
  serialize(): string;
}

interface Identifiable {
  readonly id: string;
}

class Session implements Serializable, Identifiable {
  readonly id: string;

  constructor(
    public userId: number,
    public token: string,
  ) {
    this.id = `session_${userId}`;
  }

  serialize(): string {
    return JSON.stringify({ id: this.id, userId: this.userId });
  }
}

const session = new Session(42, 'abc123');
console.log('Session ID:', session.id);
console.log('Serialized:', session.serialize());


console.log('\n=== 7. Declaration merging (interface only) ===');

interface Config {
  host: string;
}

// Merging — TypeScript combines both declarations
interface Config {
  port: number;
}

const config: Config = { host: 'localhost', port: 3000 };
console.log('Config:', config);

// This is useful for extending library types:
// declare module 'express' {
//   interface Request {
//     user?: User;
//   }
// }

console.log('\n✅ Interfaces examples complete!');
