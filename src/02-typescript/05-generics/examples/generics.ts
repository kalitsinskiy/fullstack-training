export {};
// ============================================
// GENERICS Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/05-generics/examples/generics.ts

console.log('=== 1. Why generics? ===');

// Without generics — lose type info
function identityAny(value: unknown): unknown {
  return value;
}
const a = identityAny(42);      // type: unknown — not useful
const b = identityAny('hello'); // type: unknown
console.log('identityAny (both unknown):', a, b);

// With generics — type flows through
function identity<T>(value: T): T {
  return value;
}
const c = identity(42);       // type: number — TypeScript infers T = number
const d = identity('hello');  // type: string
const e = identity<boolean>(true); // explicitly specify T

console.log(c, d, e);


console.log('\n=== 2. Generic functions ===');

function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function reverse<T>(arr: T[]): T[] {
  return [...arr].reverse();
}

console.log(first([1, 2, 3]));          // 1 (number)
console.log(last(['a', 'b', 'c']));     // 'c' (string)
console.log(reverse([true, false]));    // [false, true]


console.log('\n=== 3. Generic constraints ===');

// T must have a length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

console.log(longest('hello', 'hi'));           // 'hello'
console.log(longest([1, 2, 3], [1, 2]));       // [1, 2, 3]
// Both args must be the SAME type T — mixing string and array doesn't work:
// longest('abcde', [1, 2]); // ❌ argument types are not compatible
// longest(10, 20);           // ❌ number has no .length

// T must have an id field
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

const users = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];
const found = findById(users, 'u2');
console.log('Found:', found); // { id: 'u2', name: 'Bob' }


console.log('\n=== 4. keyof constraint ===');

// Access any property safely
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30, active: true };
console.log(getProperty(user, 'name'));   // 'Alice' (string)
console.log(getProperty(user, 'age'));    // 30 (number)
console.log(getProperty(user, 'active')); // true (boolean)
// getProperty(user, 'email'); // ❌ 'email' not in typeof user

// Set any property safely
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}
const updated = setProperty(user, 'age', 31);
console.log('Updated:', updated);


console.log('\n=== 5. Generic interfaces ===');

interface Wrapper<T> {
  value: T;
  map<U>(fn: (value: T) => U): Wrapper<U>;
}

function wrap<T>(value: T): Wrapper<T> {
  return {
    value,
    map(fn) {
      return wrap(fn(this.value));
    },
  };
}

const result = wrap(5)
  .map(n => n * 2)    // Wrapper<number>
  .map(n => `${n}!`); // Wrapper<string>

console.log('Wrapped result:', result.value); // '10!'


console.log('\n=== 6. Generic class ===');

class Pair<A, B> {
  constructor(
    public readonly first: A,
    public readonly second: B,
  ) {}

  swap(): Pair<B, A> {
    return new Pair(this.second, this.first);
  }

  toArray(): [A, B] {
    return [this.first, this.second];
  }
}

const p = new Pair('hello', 42);
console.log('Pair:', p.toArray());          // ['hello', 42]
console.log('Swapped:', p.swap().toArray()); // [42, 'hello']


console.log('\n=== 7. Generic with default type ===');

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

function success<T>(data: T): ApiResponse<T> {
  return { data, status: 200, message: 'OK' };
}

function error(message: string): ApiResponse<null> {
  return { data: null, status: 500, message };
}

const userResponse = success({ id: 1, name: 'Alice' }); // ApiResponse<{id:number,name:string}>
const errResponse = error('Something went wrong');       // ApiResponse<null>

console.log('Success:', userResponse);
console.log('Error:', errResponse);


console.log('\n=== 8. Practical: type-safe EventEmitter ===');

type EventMap = Record<string, unknown[]>;

class TypedEmitter<TEvents extends EventMap> {
  private listeners = new Map<keyof TEvents, ((...args: unknown[]) => void)[]>();

  on<K extends keyof TEvents>(event: K, listener: (...args: TEvents[K]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, listener as (...args: unknown[]) => void]);
  }

  emit<K extends keyof TEvents>(event: K, ...args: TEvents[K]): void {
    (this.listeners.get(event) ?? []).forEach(fn => fn(...args));
  }
}

type AppEvents = {
  login: [userId: string];
  error: [message: string, code: number];
};

const emitter = new TypedEmitter<AppEvents>();
emitter.on('login', (userId) => console.log(`User logged in: ${userId}`));
emitter.on('error', (msg, code) => console.log(`Error ${code}: ${msg}`));

emitter.emit('login', 'user_42');
emitter.emit('error', 'Not found', 404);

console.log('\n✅ Generics examples complete!');
