export {};
// ============================================
// FUNCTION TYPES Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/03-functions/examples/function-types.ts

console.log('=== 1. Basic typed functions ===');

function add(a: number, b: number): number {
  return a + b;
}

const multiply = (a: number, b: number): number => a * b;

// Return type inference — TypeScript knows it returns string
function greet(name: string) {
  return `Hello, ${name}!`;
}

console.log(add(3, 4));
console.log(multiply(5, 6));
console.log(greet('Alice'));


console.log('\n=== 2. Optional and default parameters ===');

function createTag(tag: string, content: string, className?: string): string {
  const cls = className ? ` class="${className}"` : '';
  return `<${tag}${cls}>${content}</${tag}>`;
}

console.log(createTag('p', 'Hello'));
console.log(createTag('p', 'Hello', 'highlight'));

function paginate(items: unknown[], page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

console.log(paginate([1,2,3,4,5,6,7,8,9,10,11,12], 2, 5)); // [6,7,8,9,10]


console.log('\n=== 3. Rest parameters ===');

function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
console.log('Sum:', sum(1, 2, 3, 4, 5)); // 15

function buildUrl(base: string, ...paths: string[]): string {
  return [base, ...paths].join('/');
}
console.log(buildUrl('https://api.example.com', 'users', '123', 'posts'));


console.log('\n=== 4. Function types ===');

// Type alias for a function signature
type Predicate<T> = (item: T) => boolean;
type Transform<T, U> = (item: T) => U;
type Callback<T> = (error: Error | null, result: T | null) => void;

// Callback used in a Node.js-style async function:
function loadData(id: string, cb: Callback<string>): void {
  cb(null, `data_${id}`);
}
loadData('1', (err, data) => console.log('Loaded:', err, data));

const isEven: Predicate<number> = (n) => n % 2 === 0;
const numToStr: Transform<number, string> = String;

console.log([1,2,3,4,5].filter(isEven)); // [2, 4]
console.log([1,2,3].map(numToStr));       // ['1', '2', '3']

// Passing functions as arguments
function applyToAll<T, U>(arr: T[], fn: Transform<T, U>): U[] {
  return arr.map(fn);
}
console.log(applyToAll([1, 2, 3], n => n * n)); // [1, 4, 9]


console.log('\n=== 5. void vs never ===');

// void — returns nothing (implicitly returns undefined)
function logInfo(message: string): void {
  console.log('[INFO]', message);
  // no return needed
}
logInfo('App started');

// never — the function never completes
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

// Practical use of never in exhaustive checks:
type TrafficLight = 'red' | 'yellow' | 'green';

function getAction(light: TrafficLight): string {
  switch (light) {
    case 'red': return 'Stop';
    case 'yellow': return 'Slow down';
    case 'green': return 'Go';
    default: return assertNever(light); // TypeScript ensures all cases handled
  }
}
console.log(getAction('red'));
console.log(getAction('green'));


console.log('\n=== 6. Function overloads ===');

// Define multiple signatures, then one implementation
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;
function format(value: string | number | Date): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value.toFixed(2);
  return value.toISOString().split('T')[0] ?? '';
}

console.log(format('  hello  '));        // 'hello'
console.log(format(3.14159));           // '3.14'
console.log(format(new Date('2024-01-15'))); // '2024-01-15'


console.log('\n=== 7. Higher-order functions ===');

// Function that returns a function
function multiplier(factor: number): (n: number) => number {
  return (n) => n * factor;
}
const double = multiplier(2);
const triple = multiplier(3);
console.log(double(5), triple(5)); // 10 15

// Compose two functions
function compose<A, B, C>(f: (b: B) => C, g: (a: A) => B): (a: A) => C {
  return (a) => f(g(a));
}

const addOne = (n: number): number => n + 1;
const numToString = (n: number): string => `num:${n}`;
const addOneThenStringify = compose(numToString, addOne);

console.log(addOneThenStringify(4)); // 'num:5'


console.log('\n=== 8. this parameter ===');

interface Counter {
  count: number;
  increment(this: Counter): void;
  reset(this: Counter): void;
}

const counter: Counter = {
  count: 0,
  increment() {
    this.count++;
  },
  reset() {
    this.count = 0;
  },
};
counter.increment();
counter.increment();
console.log('Count:', counter.count); // 2

console.log('\n✅ Function types examples complete!');
