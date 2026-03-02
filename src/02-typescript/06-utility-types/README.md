# Utility Types

## Quick Overview

TypeScript ships with a set of built-in generic types that transform existing types. These are called **utility types** — you use them constantly in real projects.

## Key Concepts

### Object Utility Types

| Utility | What it does |
|---------|-------------|
| `Partial<T>` | All properties become optional |
| `Required<T>` | All properties become required |
| `Readonly<T>` | All properties become readonly |
| `Pick<T, K>` | Keep only specified properties |
| `Omit<T, K>` | Remove specified properties |
| `Record<K, V>` | Object type with keys K and values V |

### `Partial<T>` and `Required<T>`

```typescript
interface User { id: string; name: string; email: string; }

type UserUpdate = Partial<User>;
// { id?: string; name?: string; email?: string }

type StrictUser = Required<UserUpdate>;
// { id: string; name: string; email: string }
```

### `Pick<T, K>` and `Omit<T, K>`

```typescript
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: string; name: string }

type PublicUser = Omit<User, 'email'>;
// { id: string; name: string }
```

### `Record<K, V>`

```typescript
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;
const perms: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read'],
};
```

---

### Union Utility Types

| Utility | What it does |
|---------|-------------|
| `Exclude<T, U>` | Remove types from union |
| `Extract<T, U>` | Keep only matching types from union |
| `NonNullable<T>` | Remove `null` and `undefined` from union |

```typescript
type Colors = 'red' | 'green' | 'blue' | 'yellow';
type PrimaryColors = Extract<Colors, 'red' | 'green' | 'blue'>; // 'red' | 'green' | 'blue'
type ExtraColors = Exclude<Colors, 'red' | 'green' | 'blue'>;   // 'yellow'

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string
```

---

### Function Utility Types

| Utility | What it does |
|---------|-------------|
| `ReturnType<T>` | Extract return type of a function |
| `Parameters<T>` | Extract parameter types as a tuple |
| `Awaited<T>` | Unwrap `Promise<T>` recursively |

```typescript
async function loadUser(id: string): Promise<User> { ... }

type UserResult = Awaited<ReturnType<typeof loadUser>>;  // User
type LoadParams = Parameters<typeof loadUser>;           // [string]
```

## Learn More

**TypeScript Handbook:**
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

## How to Work

1. **Study examples**:
   ```bash
   npx ts-node src/02-typescript/06-utility-types/examples/utility-types.ts
   ```

2. **Complete exercises**:
   ```bash
   npx ts-node src/02-typescript/06-utility-types/exercises/utility-types.ts
   ```
