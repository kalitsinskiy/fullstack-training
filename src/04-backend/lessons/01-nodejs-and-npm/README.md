# Node.js & npm

## Quick Overview

Node.js is a JavaScript runtime built on Chrome's V8 engine. It lets you run JavaScript outside the browser -- on servers, CLI tools, scripts. Combined with npm (Node Package Manager), it forms the foundation of modern backend JavaScript development.

```bash
node -v        # check Node version
npm -v         # check npm version
```

## Key Concepts

### V8 Engine

V8 is Google's open-source JavaScript engine (written in C++). It compiles JavaScript directly to machine code rather than interpreting it. Node.js embeds V8 and adds APIs for file I/O, networking, and OS interaction that don't exist in the browser.

### Event Loop (Simplified)

Node.js is single-threaded but non-blocking. The event loop is the mechanism that allows Node to perform I/O operations without blocking the main thread.

```
   ┌───────────────────────────┐
┌─>│         timers             │  ← setTimeout, setInterval callbacks
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │     pending callbacks      │  ← I/O callbacks deferred to next loop
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │       idle, prepare        │  ← internal use only
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │         poll               │  ← retrieve new I/O events
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │         check              │  ← setImmediate callbacks
│  └──────────┬────────────────┘
│  ┌──────────┴────────────────┐
│  │     close callbacks        │  ← socket.on('close', ...)
│  └──────────┘
│             │
└─────────────┘
```

Key rules:
- `process.nextTick()` runs **before** the event loop continues (microtask queue)
- `Promise` callbacks also run in the microtask queue
- `setTimeout(fn, 0)` runs in the **timers** phase
- `setImmediate(fn)` runs in the **check** phase

```javascript
console.log('1: synchronous');

setTimeout(() => console.log('2: setTimeout'), 0);
setImmediate(() => console.log('3: setImmediate'));
process.nextTick(() => console.log('4: nextTick'));
Promise.resolve().then(() => console.log('5: promise'));

console.log('6: synchronous');

// Output:
// 1: synchronous
// 6: synchronous
// 4: nextTick
// 5: promise
// 2: setTimeout (or 3 — order between setTimeout(0) and setImmediate is non-deterministic in the main module)
// 3: setImmediate (or 2)
```

### CJS vs ESM

Node.js supports two module systems:

**CommonJS (CJS)** -- the original Node.js module system:
```javascript
// math.js
const add = (a, b) => a + b;
module.exports = { add };

// app.js
const { add } = require('./math');
```

**ES Modules (ESM)** -- the standard JavaScript module system:
```javascript
// math.mjs (or .js with "type": "module" in package.json)
export const add = (a, b) => a + b;

// app.mjs
import { add } from './math.mjs';
```

| Feature | CJS | ESM |
|---------|-----|-----|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | Synchronous | Asynchronous |
| File extension | `.js` (default) | `.mjs` or `.js` with `"type": "module"` |
| Top-level await | No | Yes |
| `__dirname` / `__filename` | Available | Not available (use `import.meta.url`) |
| Tree-shaking | No | Yes |

### npm: Package Manager

**package.json anatomy:**
```json
{
  "name": "santa-api",
  "version": "1.0.0",
  "description": "Secret Santa API service",
  "main": "dist/main.js",
  "scripts": {
    "start": "node dist/main.js",
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "fastify": "^5.2.0"
  },
  "devDependencies": {
    "typescript": "~5.7.0",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**`npm install` vs `npm ci`:**
| | `npm install` | `npm ci` |
|---|---|---|
| Reads | `package.json` | `package-lock.json` |
| Updates lockfile | Yes (if needed) | No (fails if out of sync) |
| `node_modules` | Merges | Deletes and reinstalls from scratch |
| Use case | Development | CI/CD, fresh installs |

**Semver (Semantic Versioning):**
```
MAJOR.MINOR.PATCH  →  5.2.1

^5.2.1  → >=5.2.1 <6.0.0   (caret — allows minor + patch updates)
~5.2.1  → >=5.2.1 <5.3.0   (tilde — allows patch updates only)
5.2.1   → exactly 5.2.1     (pinned)
```

### Scripts

npm scripts are shortcuts defined in `package.json`:
```bash
npm run dev          # runs "dev" script
npm test             # shortcut for "npm run test"
npm start            # shortcut for "npm run start"
npm run build        # runs "build" script
```

### .nvmrc

Pin the Node.js version for your project:
```bash
# .nvmrc
20.11.0
```

```bash
nvm use              # reads .nvmrc and switches to that version
nvm install          # installs the version from .nvmrc
```

### The `node:` Protocol Prefix

Since Node.js 16+, built-in modules can be imported with a `node:` prefix:

```javascript
// Both work, but node: prefix is recommended:
import * as http from 'http';        // legacy — works but ambiguous
import * as http from 'node:http';   // explicit — clearly a built-in module
```

Why use `node:` prefix?
- **Clarity** -- makes it obvious the import is a Node.js built-in, not an npm package
- **Safety** -- prevents a malicious npm package named `http` from being loaded instead
- **Convention** -- all modern Node.js docs and frameworks use it

Throughout this course, we use `node:` prefix for all built-in modules.

### Creating an HTTP Server

Node.js has a built-in `http` module -- no packages needed:

```typescript
import * as http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from Node.js!' }));
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Learn More

- [Node.js Official Docs](https://nodejs.org/docs/latest/api/)
- [Node.js Event Loop Explained](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js Modules (CJS)](https://nodejs.org/docs/latest/api/modules.html)
- [Node.js ES Modules](https://nodejs.org/docs/latest/api/esm.html)
- [npm Docs](https://docs.npmjs.com/)
- [Semver Explained](https://semver.org/)

## How to Work

1. **Study examples**:
   ```bash
   node src/04-backend/lessons/01-nodejs-and-npm/examples/event-loop.js
   node src/04-backend/lessons/01-nodejs-and-npm/examples/modules-cjs.js
   node src/04-backend/lessons/01-nodejs-and-npm/examples/modules-esm.mjs
   npx ts-node src/04-backend/lessons/01-nodejs-and-npm/examples/http-server.ts
   ```

2. **Complete exercises**:
   ```bash
   # HTTP server with in-memory CRUD:
   npx ts-node src/04-backend/lessons/01-nodejs-and-npm/exercises/server.ts

   # CJS modules:
   node src/04-backend/lessons/01-nodejs-and-npm/exercises/modules-cjs/app.js

   # ESM modules:
   node src/04-backend/lessons/01-nodejs-and-npm/exercises/modules-esm/app.mjs
   ```

## App Task

See [exercises/app-task.md](exercises/app-task.md) — initialize both Secret Santa backend services at the **repo root**.
