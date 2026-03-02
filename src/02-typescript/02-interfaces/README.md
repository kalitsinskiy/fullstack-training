# Interfaces & Type Aliases

## Quick Overview

Both `interface` and `type` describe the shape of an object. Knowing when to use which is one of the most common TypeScript questions.

## Key Concepts

### Interface

Describes the shape (contract) of an object or class:

```typescript
interface User {
  id: number;
  name: string;
  email?: string;    // optional
  readonly role: string; // cannot change after creation
}
```

### Type Alias

Names any type — objects, unions, primitives, tuples:

```typescript
type User = {
  id: number;
  name: string;
};

type ID = string | number;       // union — only type can do this
type Pair = [string, number];    // tuple — only type can do this
type StringMap = Record<string, string>; // alias for complex type
```

---

## type vs interface — When to Use Which

### Use `interface` when:
1. **Describing objects that will be implemented by classes**
   ```typescript
   interface Serializable {
     serialize(): string;
     deserialize(data: string): void;
   }
   class UserSession implements Serializable { ... }
   ```

2. **You want declaration merging** (adding properties to existing interface from different files)
   ```typescript
   interface Window { myPlugin: Plugin; } // extend built-in types
   ```

3. **Building a public API / library** — interfaces are more extendable

### Use `type` when:
1. **Union or intersection types**
   ```typescript
   type ID = string | number;
   type AdminUser = User & Admin;
   ```

2. **Tuple types**
   ```typescript
   type Coordinates = [number, number];
   ```

3. **Mapped types, conditional types, utility types**
   ```typescript
   type ReadonlyUser = Readonly<User>;
   type NullableUser = User | null;
   ```

4. **Primitives and function signatures**
   ```typescript
   type Callback = (error: Error | null, result: string) => void;
   ```

### Key differences

| Feature | `interface` | `type` |
|---------|-------------|--------|
| Object shape | ✅ | ✅ |
| Union/Intersection | ❌ | ✅ |
| Extends | `extends` keyword | `&` intersection |
| Declaration merging | ✅ (same name = merges) | ❌ (same name = error) |
| Implements in class | ✅ | ✅ |
| Tuple / primitive alias | ❌ | ✅ |

**Rule of thumb:** Use `interface` for objects and classes. Use `type` for everything else.

---

### Extending

```typescript
// interface extends interface
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// type uses intersection
type Animal = { name: string };
type Dog = Animal & { breed: string };
```

### Index Signatures

When you don't know all property names in advance:
```typescript
interface StringMap {
  [key: string]: string;
}
const headers: StringMap = {
  'Content-Type': 'application/json',
  Authorization: 'Bearer token',
};
```

## Learn More

**TypeScript Handbook:**
- [Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [Type Aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)
- [Differences: Type vs Interface](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

## How to Work

1. **Study examples**: Run each file in `examples/` folder
   ```bash
   npx ts-node src/02-typescript/02-interfaces/examples/interfaces.ts
   npx ts-node src/02-typescript/02-interfaces/examples/type-vs-interface.ts
   ```

2. **Complete exercises**: Open `exercises/interfaces.ts` and solve TODOs
   ```bash
   npx ts-node src/02-typescript/02-interfaces/exercises/interfaces.ts
   ```
