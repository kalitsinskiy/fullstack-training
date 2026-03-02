# ts-node Information

> **Note:** This content should be added to TypeScript module documentation when that module is created.

---

## 🚀 ts-node

### What is it?

**ts-node** is a tool for running TypeScript files directly, without prior compilation to JavaScript. It's convenient for:
- TypeScript code development and testing
- Writing scripts in TypeScript
- Quick prototyping

### How to Install

```bash
# Locally in project (recommended)
npm install --save-dev ts-node typescript

# Globally
npm install -g ts-node typescript
```

### Basic Commands

```bash
# Run TypeScript file
ts-node script.ts

# Run TypeScript file via npx (if not installed globally)
npx ts-node script.ts

# Run REPL (interactive mode)
ts-node

# Run with specific tsconfig
ts-node --project tsconfig.json script.ts

# Show help
ts-node --help
```

### Example

Create `hello.ts` file:
```typescript
const message: string = 'Hello from TypeScript!';
console.log(message);

function add(a: number, b: number): number {
  return a + b;
}

console.log(`2 + 3 = ${add(2, 3)}`);
```

Run it:
```bash
npx ts-node hello.ts
# Output:
# Hello from TypeScript!
# 2 + 3 = 5
```

### Usage in this project

```bash
# Run TypeScript example
npx ts-node src/02-typescript/01-types/examples/basic-types.ts

# Run TypeScript exercise for testing
npx ts-node src/02-typescript/01-types/exercises/types.ts
```

---

**When to add this:** When creating the TypeScript Basics module (src/02-typescript/)
