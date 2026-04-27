# Design Patterns in JavaScript

Design patterns are reusable solutions to common software design problems.

## Categories

### Creational — how objects are created
- **Singleton** — only one instance exists
- **Factory** — creates objects without specifying exact class
- **Builder** — step-by-step object construction

### Structural — how objects are composed
- **Adapter** — makes incompatible interfaces work together
- **Decorator** — adds behavior without modifying original
- **Proxy** — controls access to an object

### Behavioral — how objects communicate
- **Observer** — one-to-many event notification
- **Strategy** — swap algorithms at runtime
- **Command** — encapsulate actions as objects
- **Iterator** — traverse without exposing internals

## JS-Specific Patterns
- **Module pattern** — encapsulation via closure/IIFE
- **Pub/Sub** — decoupled event bus
- **Mixin** — add capabilities to classes without inheritance

## When to Use Patterns

Patterns solve specific problems. Don't apply them preemptively:
- ✅ When you have a clear problem the pattern addresses
- ❌ Not "just in case" (over-engineering)
- ❌ Not when simple code works fine

## Learn More

- [Refactoring.Guru — Design Patterns](https://refactoring.guru/design-patterns)
- [javascript.info: Prototypes](https://javascript.info/prototypes)
- [MDN: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [JavaScript Design Patterns (book by Addy Osmani)](https://www.patterns.dev/)
