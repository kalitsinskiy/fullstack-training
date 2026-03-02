# TypeScript Classes

## Quick Overview

TypeScript classes extend JavaScript classes with access modifiers, typed properties, abstract classes, and interface implementation.

## Key Concepts

### Typed Properties and Constructor

```typescript
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}
```

### Parameter Properties (shorthand)

Declare and initialize in one step:
```typescript
class User {
  constructor(
    public name: string,      // public — accessible everywhere
    private age: number,      // private — only within this class
    protected role: string,   // protected — this class and subclasses
    readonly id: string,      // readonly — set once, never changed
  ) {}
}
```

### Access Modifiers

| Modifier | Class | Subclass | Outside |
|----------|-------|----------|---------|
| `public` | ✅ | ✅ | ✅ |
| `protected` | ✅ | ✅ | ❌ |
| `private` | ✅ | ❌ | ❌ |
| `readonly` | read ✅ write on init | same | read ✅ |

### Implements Interface

A class can implement one or more interfaces:
```typescript
interface Printable {
  print(): void;
}
class Document implements Printable {
  print(): void {
    console.log('Printing...');
  }
}
```

### Abstract Classes

Cannot be instantiated directly — must be subclassed:
```typescript
abstract class Shape {
  abstract area(): number;

  describe(): string {
    return `Area is ${this.area()}`;
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; }
}
```

### Getters and Setters

```typescript
class Temperature {
  private _celsius: number = 0;

  get fahrenheit(): number {
    return this._celsius * 9/5 + 32;
  }
  set fahrenheit(value: number) {
    this._celsius = (value - 32) * 5/9;
  }
}
```

## Learn More

**TypeScript Handbook:**
- [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [Class Members](https://www.typescriptlang.org/docs/handbook/2/classes.html#class-members)

## How to Work

1. **Study examples**:
   ```bash
   npx ts-node src/02-typescript/04-classes/examples/classes.ts
   ```

2. **Complete exercises**:
   ```bash
   npx ts-node src/02-typescript/04-classes/exercises/classes.ts
   ```
