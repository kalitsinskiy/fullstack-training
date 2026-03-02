export {};
// ============================================
// CONDITIONAL TYPES & INFER Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/05-generics/examples/infer.ts

console.log('=== 1. Conditional types basics ===');

// T extends Condition ? TrueType : FalseType
type IsString<T> = T extends string ? true : false;
type IsArray<T> = T extends unknown[] ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsArray<string[]>;  // true
type D = IsArray<string>;    // false

// These are compile-time types — to show them at runtime:
const a: A = true;
const b: B = false;
const c: C = true;
console.log('IsString<string>:', a);
console.log('IsString<number>:', b);
console.log('IsArray<string[]>:', c);


console.log('\n=== 2. infer — capturing a type ===');

// Without infer — we can only check the shape
type IsPromise<T> = T extends Promise<unknown> ? true : false;

// With infer — we can EXTRACT the inner type
type UnwrapPromise<T> = T extends Promise<infer Inner> ? Inner : T;

type P1 = UnwrapPromise<Promise<string>>;   // string
type P2 = UnwrapPromise<Promise<number[]>>; // number[]
type P3 = UnwrapPromise<boolean>;           // boolean (not a Promise — returns T)

const p1: P1 = 'hello';
const p2: P2 = [1, 2, 3];
const p3: P3 = true;
console.log('UnwrapPromise<Promise<string>>:', p1);
console.log('UnwrapPromise<Promise<number[]>>:', p2);
console.log('UnwrapPromise<boolean>:', p3);


console.log('\n=== 3. Built-in utility types using infer ===');

// These are already built in TypeScript — here's how they work internally:

// ReturnType<T> — extracts the return type of a function
type MyReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

function getUser() { return { id: 1, name: 'Alice' }; }
function fetchData(): Promise<string[]> { return Promise.resolve([]); }

type UserType = MyReturnType<typeof getUser>;      // { id: number; name: string }
type FetchReturn = MyReturnType<typeof fetchData>; // Promise<string[]>

const userObj: UserType = { id: 1, name: 'Alice' };
console.log('ReturnType result:', userObj);

// Parameters<T> — extracts parameter types as a tuple
type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never;

function createPost(_title: string, _body: string, _tags: string[]): void { /* stub */ }
type PostParams = MyParameters<typeof createPost>; // [string, string, string[]]

const params: PostParams = ['Hello', 'World', ['ts', 'js']];
console.log('Parameters:', params);


console.log('\n=== 4. Array element type ===');

type ElementType<T> = T extends (infer E)[] ? E : never;

type StrElement = ElementType<string[]>;   // string
type NumElement = ElementType<number[]>;   // number
type ObjElement = ElementType<{ id: number }[]>; // { id: number }

const elem: ObjElement = { id: 1 };
console.log('Array element type:', elem);

// Deep unwrap
type DeepElement<T> = T extends (infer E)[]
  ? E extends unknown[]
    ? DeepElement<E>
    : E
  : T;

type Deep1 = DeepElement<string[]>;    // string
type Deep2 = DeepElement<string[][]>;  // string
type Deep3 = DeepElement<number[][][]>; // number

const deep: Deep3 = 42;
console.log('Deep element:', deep);


console.log('\n=== 5. Practical: inferring Promise resolution ===');

type Awaited2<T> = T extends Promise<infer R>
  ? R extends Promise<unknown>
    ? Awaited2<R>  // recursive for nested Promises
    : R
  : T;

type Resolved1 = Awaited2<Promise<string>>;           // string
type Resolved2 = Awaited2<Promise<Promise<number>>>;  // number
type Resolved3 = Awaited2<boolean>;                    // boolean

const r1: Resolved1 = 'done';
const r2: Resolved2 = 42;
console.log('Awaited<Promise<string>>:', r1);
console.log('Awaited<Promise<Promise<number>>>:', r2);
console.log('Awaited<boolean>:', new Boolean(false).valueOf() as boolean);


console.log('\n=== 6. Distributive conditional types ===');

// When T is a naked type parameter, conditional types distribute over unions
type ToArray<T> = T extends unknown ? T[] : never;

type StringOrNumberArray = ToArray<string | number>;
// Distributes to: ToArray<string> | ToArray<number>
// = string[] | number[]

const arr: StringOrNumberArray = [1, 2, 3]; // number[]
const arr2: StringOrNumberArray = ['a', 'b']; // string[]
console.log('Distributed:', arr, arr2);

// To prevent distribution, wrap in a tuple:
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
type Together = ToArrayNonDist<string | number>; // (string | number)[]

const together: Together = [1, 'hello', 2, 'world'];
console.log('Non-distributed:', together);


console.log('\n=== 7. Practical: Extract function from object ===');

// Get all keys of an object whose values are functions
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

const api = {
  getUser: () => ({ id: 1 }),
  createUser: (name: string) => ({ id: 2, name }),
  apiUrl: 'https://example.com',
  version: 1,
};

type ApiMethods = FunctionKeys<typeof api>; // 'getUser' | 'createUser'

const method: ApiMethods = 'getUser';
console.log('Method key:', method);

console.log('\n✅ Conditional types & infer examples complete!');

// Exported for type reference — these demonstrate conditional type results
export type { D, IsPromise, FetchReturn, StrElement, NumElement, Deep1, Deep2, Resolved3 };
