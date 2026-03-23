export {};
// ============================================
// BASIC TYPES Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/01-types/examples/basic-types.ts

console.log('=== 1. Primitive types ===');

const firstName: string = 'Alice';
const age: number = 30;
const isAdmin: boolean = true;
const score: number = 9.5;

console.log(`${firstName}, age ${age}, admin: ${isAdmin}, score: ${score}`);

// TypeScript infers types without annotation
const city = 'Kyiv';       // string
const year = 2024;         // number
const active = true;       // boolean
console.log(city, year, active);


console.log('\n=== 2. null and undefined ===');

let nickname: string | null = null;
console.log('nickname before:', nickname);
nickname = 'alice99';
console.log('nickname after:', nickname);

let data: string | undefined;
console.log('data before:', data); // undefined
data = 'loaded';
console.log('data after:', data);


console.log('\n=== 3. any vs unknown ===');

// any — disables type checking, avoid when possible
let anything: any = 42;
anything = 'hello';
// TypeScript allows calling any method on 'any' — no compile error, but can crash at runtime:
// anything = true; anything.toUpperCase(); // would throw at runtime — dangerous!
console.log(anything.toUpperCase()); // works now since anything = 'hello'

// unknown — type-safe: must narrow before using
const mystery: unknown = 'hello world';

if (typeof mystery === 'string') {
  console.log(mystery.toUpperCase()); // HELLO WORLD — safe
}
// mystery.toUpperCase(); // ❌ would be a compile error


console.log('\n=== 4. void and never ===');

function logMessage(msg: string): void {
  console.log('Log:', msg);
  // no return value
}

logMessage('TypeScript is great');

// never — function that never returns (throws or loops forever)
function fail(message: string): never {
  throw new Error(message);
}

// never used in exhaustive checks:
type Status = 'active' | 'inactive';
function describeStatus(s: Status): string {
  if (s === 'active') return 'User is active';
  if (s === 'inactive') return 'User is inactive';
  // If you add a new Status value and forget to handle it, TypeScript will catch it here:
  return fail(`Unhandled status: ${s}`);
}
console.log(describeStatus('active'));


console.log('\n=== 5. Arrays and Tuples ===');

const names: string[] = ['Alice', 'Bob', 'Charlie'];
const scores: Array<number> = [95, 87, 72];
console.log('Names:', names);
console.log('Scores:', scores);

// Tuple — fixed structure, each position has a known type
const user: [string, number, boolean] = ['Alice', 30, true];
const [userName, userAge, userActive] = user;
console.log(`${userName} is ${userAge} years old, active: ${userActive}`);

// Named tuples (TypeScript 4+) — more readable
type Point = [x: number, y: number];
const zeroPoint: Point = [0, 0];
console.log('Point:', zeroPoint);


console.log('\n=== 6. Enums ===');

// Regular enum — creates a runtime object
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right, // 3
}
console.log('Direction.Up:', Direction.Up);
console.log('Direction[0]:', Direction[0]); // reverse lookup

// String enum — no reverse lookup, safer
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}
console.log('Color.Red:', Color.Red);

// const enum — completely erased at compile time (faster, no object)
const enum Weekday {
  Monday = 1,
  Tuesday,
  Wednesday,
}
const today: Weekday = Weekday.Monday;
console.log('Today (value):', today); // 1


console.log('\n=== 7. Type assertions ===');

// When you know more than TypeScript
const input = 'hello world';
const strLength = (input as string).length;
console.log('Length:', strLength);

// Useful when working with JSON or DOM
const raw: unknown = JSON.parse('{"name": "Alice"}');
const parsed = raw as { name: string };
console.log('Parsed name:', parsed.name);

console.log('\n✅ Basic types examples complete!');
