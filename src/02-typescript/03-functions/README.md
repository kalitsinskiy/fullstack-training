# TypeScript Functions

## Quick Overview

TypeScript adds type annotations to parameters and return values, enabling the compiler to catch mismatches before runtime.

## Key Concepts

### Parameter and Return Types

```typescript
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;

// TypeScript can infer the return type — but explicit is clearer for public APIs
function greet(name: string) {
  return `Hello, ${name}`; // inferred: string
}
```

### Optional and Default Parameters

```typescript
function createUser(name: string, role: string = 'user', email?: string): User {
  return { name, role, email };
}

createUser('Alice');                    // role='user', email=undefined
createUser('Bob', 'admin');             // email=undefined
createUser('Carol', 'user', 'c@x.com');
```

### Rest Parameters

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3, 4, 5); // 15
```

### Function Types

```typescript
// Type alias for a function
type Comparator<T> = (a: T, b: T) => number;
type EventHandler = (event: Event) => void;

// Interface with call signature
interface Formatter {
  (value: string): string;
  locale: string;
}
```

### void vs never

```typescript
// void — function returns nothing (undefined)
function log(msg: string): void {
  console.log(msg);
}

// never — function never returns (throws or infinite loop)
function panic(msg: string): never {
  throw new Error(msg);
}
```

### Overloads

Define multiple call signatures for the same function:
```typescript
function format(value: string): string;
function format(value: number, decimals: number): string;
function format(value: string | number, decimals = 2): string {
  if (typeof value === 'string') return value.trim();
  return value.toFixed(decimals);
}
```

### Generic Functions

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

first([1, 2, 3]);      // number | undefined
first(['a', 'b']);     // string | undefined
```

## Learn More

**TypeScript Handbook:**
- [Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions)

## How to Work

1. **Study examples**:
   ```bash
   npx ts-node src/02-typescript/03-functions/examples/function-types.ts
   ```

2. **Complete exercises**:
   ```bash
   npx ts-node src/02-typescript/03-functions/exercises/functions.ts
   ```
