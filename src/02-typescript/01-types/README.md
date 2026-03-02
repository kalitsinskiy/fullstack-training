# TypeScript Types

## Quick Overview

TypeScript adds static typing to JavaScript. You annotate variables, parameters, and return values with types — the compiler catches mistakes before code runs.

## Key Concepts

### Primitive Types

```typescript
const name: string = 'Alice';
const age: number = 30;
const isAdmin: boolean = true;
const nothing: null = null;
const notSet: undefined = undefined;
```

TypeScript can **infer** the type without annotation:
```typescript
const name = 'Alice'; // TypeScript knows it's string
```

### Special Types

| Type | Description | When to use |
|------|-------------|-------------|
| `any` | Disables type checking | Avoid — escape hatch only |
| `unknown` | Type-safe alternative to `any` | When type is truly unknown |
| `never` | Value that never occurs | Exhaustive checks, unreachable code |
| `void` | No return value | Function return types |

### Union Types

A value that can be one of several types:
```typescript
let id: string | number = 1;
id = 'abc'; // also valid

function format(value: string | number): string {
  return String(value);
}
```

### Literal Types

A value that must be a specific literal:
```typescript
type Direction = 'left' | 'right' | 'up' | 'down';
type Status = 200 | 404 | 500;

let direction: Direction = 'left'; // ✅
// direction = 'diagonal'; // ❌ not assignable
```

### Type Narrowing

TypeScript narrows union types inside conditionals:
```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows value is string here
    return value.toUpperCase();
  }
  return value.toFixed(2); // number here
}
```

### Arrays and Tuples

```typescript
const names: string[] = ['Alice', 'Bob'];
const ids: Array<number> = [1, 2, 3];

// Tuple: fixed-length array with known types per position
const pair: [string, number] = ['age', 25];
const [label, value] = pair;
```

### Enums

```typescript
enum Color {
  Red,   // 0
  Green, // 1
  Blue   // 2
}

// Prefer const enum (erased at compile time, no runtime object)
const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}
```

### Type Assertions

When you know more than TypeScript:
```typescript
const input = document.getElementById('name') as HTMLInputElement;
// or the older syntax: <HTMLInputElement>document.getElementById('name')
```

## Learn More

**TypeScript Handbook:**
- [Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Literal Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)

**TypeScript Playground:**
- [typescriptlang.org/play](https://www.typescriptlang.org/play)

## How to Work

1. **Study examples**: Run each file in `examples/` folder
   ```bash
   npx ts-node src/02-typescript/01-types/examples/basic-types.ts
   npx ts-node src/02-typescript/01-types/examples/union-types.ts
   ```

2. **Complete exercises**: Open `exercises/types.ts` and solve TODOs
   ```bash
   npx ts-node src/02-typescript/01-types/exercises/types.ts
   ```
