# Generics

## Quick Overview

Generics let you write reusable code that works with **any type** while still preserving full type safety. Think of `<T>` as a type parameter — like a variable, but for types.

## Key Concepts

### Basic Generic Function

```typescript
// Without generics — loses type info
function first(arr: unknown[]): unknown { return arr[0]; }

// With generics — type is preserved
function first<T>(arr: T[]): T | undefined { return arr[0]; }

const n = first([1, 2, 3]);     // type: number | undefined
const s = first(['a', 'b']);    // type: string | undefined
```

### Generic Constraints

Restrict what types can be used with `extends`:
```typescript
// T must have a .length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest('hello', 'hi');          // ✅
longest([1, 2, 3], [1, 2]);      // ✅
longest(10, 20);                  // ❌ number has no .length
```

### Multiple Type Parameters

```typescript
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}
const entry = pair('name', 42); // [string, number]
```

### Generic Interfaces and Types

```typescript
interface Repository<T> {
  findById(id: string): T | undefined;
  findAll(): T[];
  save(entity: T): T;
  delete(id: string): void;
}
```

### `keyof` and Generic Constraints

```typescript
// Get value of any property of an object
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
const name = getProperty(user, 'name');  // string
const age = getProperty(user, 'age');    // number
// getProperty(user, 'email');           // ❌ not a key of user
```

### Conditional Types

Types that branch based on a condition:
```typescript
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'
```

### `infer`

Extract a type from within another type in a conditional:
```typescript
// Extract the return type of a function
type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

type R1 = ReturnType<() => string>;    // string
type R2 = ReturnType<() => number[]>;  // number[]

// Extract the element type from an array
type ElementType<T> = T extends (infer E)[] ? E : never;
type E1 = ElementType<string[]>;  // string
type E2 = ElementType<number[]>;  // number
```

`infer` says: "if the type matches this shape, capture the part I marked as `infer X` into `X`."

### Default Type Parameters

```typescript
interface Response<T = unknown> {
  data: T;
  status: number;
}

const r1: Response = { data: 'anything', status: 200 };       // T = unknown
const r2: Response<string> = { data: 'hello', status: 200 };  // T = string
```

## Learn More

**TypeScript Handbook:**
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

## How to Work

1. **Study examples**:
   ```bash
   npx ts-node src/02-typescript/05-generics/examples/generics.ts
   npx ts-node src/02-typescript/05-generics/examples/infer.ts
   ```

2. **Complete exercises**:
   ```bash
   npx ts-node src/02-typescript/05-generics/exercises/generics.ts
   ```
