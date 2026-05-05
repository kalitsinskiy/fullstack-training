# React Fundamentals

## Quick Overview

React is a JavaScript library for building user interfaces from **components**. Instead of manipulating the DOM directly, you describe **what** the UI should look like for a given state, and React figures out **how** to update the DOM efficiently. Components are functions that return JSX (HTML-like syntax in JavaScript). State is managed with the `useState` hook, and user interactions are handled through event handlers.

## Key Concepts

### Why React?

- **Component model** — break the UI into small, reusable, self-contained pieces
- **Declarative** — describe the desired state, not the DOM operations to get there
- **Virtual DOM** — React diffs a lightweight in-memory tree against the real DOM and only updates what changed
- **Ecosystem** — massive community, libraries for routing, state management, testing, etc.

### JSX

JSX looks like HTML but lives in your JavaScript/TypeScript files. A build step compiles it to plain function calls — you don't write those calls yourself, but knowing they exist helps you debug.

```tsx
// JSX
const element = <h1 className="title">Hello, World!</h1>;

// Compiles to (with the modern automatic JSX runtime, the default in Vite + React):
import { jsx as _jsx } from 'react/jsx-runtime';
const element = _jsx('h1', { className: 'title', children: 'Hello, World!' });
```

> **Which tool does the compiling?** In a Vite project: **esbuild** for dev (very fast), **Rollup** for the production build. Some templates use the SWC plugin (`@vitejs/plugin-react-swc`) — it's the same JSX output, just a different compiler under the hood. Older CRA projects use Babel. You'll bump into this only when you see errors like `React is not defined` (legacy non-automatic runtime) or `Cannot find module 'react/jsx-runtime'` (mismatched config).

Key differences from HTML:
- `className` instead of `class` (because `class` is a reserved word in JS)
- `htmlFor` instead of `for` on labels
- Self-closing tags are required: `<img />`, `<input />`, `<br />`
- Style is an object: `style={{ color: 'red', fontSize: '16px' }}`
- All attribute names are camelCase: `onClick`, `onChange`, `tabIndex`

**Expressions in JSX** — use `{}` to embed any JavaScript expression:

```tsx
const name = 'Alice';
const count = 5;

return (
  <div>
    <h1>Hello, {name}!</h1>
    <p>You have {count} items in your wishlist.</p>
    <p>Total: {count * 2}</p>
    <p>Current date: {new Date().toLocaleDateString()}</p>
  </div>
);
```

**Fragments** — when you need to return multiple elements without a wrapper `<div>`:

```tsx
return (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
```

### Functional Components

A React component is a function that returns JSX:

```tsx
// Function declaration — most common, hoisted, easy to read in stack traces
function Greeting() {
  return <h1>Hello, World!</h1>;
}

// Arrow function — equivalent. Some teams prefer this for consistency with handlers.
const Greeting = () => <h1>Hello, World!</h1>;

// Usage
<Greeting />
```

Both work. Pick one style and stick with it across the codebase. This course uses function declarations for components and arrow functions for inline handlers.

### Props

Props are the inputs to a component — like function arguments:

```tsx
interface WelcomeProps {
  name: string;
  role?: string;  // optional
}

function Welcome({ name, role = 'guest' }: WelcomeProps) {
  return (
    <div>
      <h2>Hello, {name}!</h2>
      <p>Role: {role}</p>
    </div>
  );
}

// Usage
<Welcome name="Alice" role="admin" />
<Welcome name="Bob" />  {/* role defaults to 'guest' */}
```

**Children prop** — content between opening and closing tags:

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage
<Card title="My Room">
  <p>12 participants</p>
  <button>Join</button>
</Card>
```

### TypeScript Patterns for Components

A few patterns you will use in every component you write. Memorize the shapes:

**1. Children — three ways**

```tsx
// Explicit prop with React.ReactNode (most flexible — accepts strings, JSX, arrays, null)
interface Props { children: React.ReactNode }

// PropsWithChildren — short helper if your component already has other props
function Layout({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <section><h2>{title}</h2>{children}</section>;
}

// Render-prop / function-as-children — when the parent controls how the child renders
interface Props { children: (count: number) => React.ReactNode }
```

**2. Inheriting native props with `ComponentPropsWithoutRef`**

When you wrap an HTML element (e.g. a custom Button), inherit its props instead of typing each one:

```tsx
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
};

function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className ?? ''}`}
      {...rest}            // forwards onClick, disabled, type, aria-*, etc.
    />
  );
}

// Usage — full IntelliSense for native button props
<Button variant="primary" onClick={handleClick} disabled={loading} aria-label="Save" />
```

For components that need a `ref` forwarded to the inner DOM element (input wrappers, third-party integrations, focus management), use `forwardRef` — see [Lesson 07 (UI Components)](../07-ui-components/README.md) for real examples in the shadcn-style primitives (`React.forwardRef<HTMLButtonElement, ButtonProps>(...)`).

**3. Discriminated unions for variants**

If your component has different shapes per variant, model it with a discriminated union — TS will enforce that you pass the right combo:

```tsx
type AlertProps =
  | { variant: 'info'; message: string }
  | { variant: 'error'; message: string; onRetry: () => void };  // onRetry only for errors

function Alert(props: AlertProps) {
  if (props.variant === 'error') {
    return <div>{props.message} <button onClick={props.onRetry}>Retry</button></div>;
  }
  return <div>{props.message}</div>;
}

<Alert variant="info" message="..." />                          // ok
<Alert variant="error" message="..." onRetry={() => fetch()} /> // ok
<Alert variant="error" message="..." />                         // TS error: missing onRetry
```

**4. Event handler types**

The signatures you will need most:

```tsx
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { /* ... */ }
function handleChange(e: React.ChangeEvent<HTMLInputElement>) { /* ... */ }
function handleSubmit(e: React.FormEvent<HTMLFormElement>) { /* ... */ }
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) { /* ... */ }
```

You rarely need to declare these explicitly — TS infers them when you write the handler inline. Use the explicit form when the handler lives outside JSX or you want documentation.

### useState Hook

`useState` lets a component remember data between renders:

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);  // initial value: 0

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}
```

Key rules:
- `useState` returns `[currentValue, setterFunction]`
- Calling the setter triggers a re-render
- State is preserved between renders (unlike local variables)
- Never mutate state directly — always use the setter

**Functional updates** — when the new state depends on the old state:

```tsx
// Preferred for updates based on previous state
setCount(prev => prev + 1);

// Avoids bugs with batched updates
function handleTripleIncrement() {
  setCount(prev => prev + 1);
  setCount(prev => prev + 1);
  setCount(prev => prev + 1);
  // count will be +3 (not +1)
}
```

**Object and array state:**

```tsx
const [user, setUser] = useState({ name: '', email: '' });

// Always create a new object (don't mutate!)
setUser({ ...user, name: 'Alice' });
// or
setUser(prev => ({ ...prev, name: 'Alice' }));

const [items, setItems] = useState<string[]>([]);

// Add item
setItems(prev => [...prev, 'New item']);

// Remove item at index
setItems(prev => prev.filter((_, i) => i !== index));

// Update item at index
setItems(prev => prev.map((item, i) => i === index ? 'Updated' : item));
```

**Typing `useState`** — TypeScript usually infers the type from the initial value:

```tsx
const [count, setCount] = useState(0);            // inferred: number
const [name, setName] = useState('');             // inferred: string
```

Pass an explicit type when the initial value alone doesn't tell TS what you want:

```tsx
const [user, setUser] = useState<User | null>(null);   // initial null, but later it's User
const [items, setItems] = useState<string[]>([]);      // empty array — TS doesn't know what's in it
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
```

**Lazy initial state** — if the initial value is **expensive to compute** (parsing JSON from localStorage, big array transform), pass a function. React calls it only on the first render:

```tsx
// BAD — runs on every render even though only the first one uses the result
const [theme, setTheme] = useState(JSON.parse(localStorage.getItem('theme') ?? '"light"'));

// GOOD — runs only on the first render
const [theme, setTheme] = useState(() => JSON.parse(localStorage.getItem('theme') ?? '"light"'));
```

This matters for state derived from localStorage, IndexedDB, or any heavy computation.

### Event Handling

React events use camelCase and pass event objects:

```tsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();  // prevent page reload
    console.log('Login:', email, password);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log In</button>
    </form>
  );
}
```

Common events:
- `onClick` — buttons, divs, any element
- `onChange` — inputs, selects, textareas
- `onSubmit` — forms
- `onKeyDown` / `onKeyUp` — keyboard
- `onFocus` / `onBlur` — focus

### Conditional Rendering

Three patterns:

```tsx
function Room({ isJoined, memberCount }: { isJoined: boolean; memberCount: number }) {
  // 1. Logical AND (&&) — render if true
  return (
    <div>
      {isJoined && <span className="badge">Joined</span>}

      {/* 2. Ternary — either/or */}
      <button>{isJoined ? 'Leave Room' : 'Join Room'}</button>

      {/* 3. Null for "render nothing" */}
      {memberCount > 0 ? <p>{memberCount} members</p> : null}
    </div>
  );
}

// 4. Early return — for loading/error states
function RoomPage({ room, isLoading }: { room: Room | null; isLoading: boolean }) {
  if (isLoading) return <p>Loading...</p>;
  if (!room) return <p>Room not found.</p>;

  return <div>{room.name}</div>;
}
```

**Warning:** Be careful with `&&` and numbers. `{count && <List />}` renders `0` when count is 0. Use `{count > 0 && <List />}` instead.

### List Rendering

Use `.map()` to render arrays. Every item needs a unique `key`:

```tsx
interface Room {
  id: string;
  name: string;
  participants: number;
}

function RoomList({ rooms }: { rooms: Room[] }) {
  return (
    <ul>
      {rooms.map(room => (
        <li key={room.id}>
          {room.name} — {room.participants} people
        </li>
      ))}
    </ul>
  );
}
```

**Why keys matter:**
- Keys help React identify which items changed, were added, or removed
- Without keys (or with index as key), React re-renders all items on any change
- Use a **stable unique ID** (database id, UUID) — not the array index
- Index as key is only safe if the list is static and never reordered

```tsx
// BAD — index as key with a dynamic list
{items.map((item, index) => <li key={index}>{item}</li>)}

// GOOD — stable unique ID
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

### Controlled vs Uncontrolled Components

Two ways to wire a form input to React.

**Controlled** — React state is the single source of truth. The DOM input is "told" what to display.

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');

  return (
    <input
      type="text"
      value={query}                                // React controls the value
      onChange={(e) => setQuery(e.target.value)}   // update state on every keystroke
      placeholder="Search rooms..."
    />
  );
}
```

What this gives you:
- The input always shows what's in state
- You can validate, transform, or restrict input as the user types
- You have the current value at any moment without reading the DOM

**Uncontrolled** — the DOM holds the value. You read it via `ref` only when needed (e.g. on submit).

```tsx
import { useRef } from 'react';

function FileUploadForm({ onUpload }: { onUpload: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={fileRef} type="file" defaultValue="" />     {/* defaultValue, not value */}
      <button type="submit">Upload</button>
    </form>
  );
}
```

**Pick uncontrolled when:**
- The value is `<input type="file">` — files literally can't be controlled.
- A third-party widget (some date pickers, autocomplete libs) demands `defaultValue` and managing its own state.
- Performance-critical massive forms where re-rendering on every keystroke matters (rare; 99% of forms don't hit this).

**Pick controlled (the default) for everything else** — live validation, formatting (uppercase room codes, masked phone numbers), conditional UI based on input. React Hook Form (Lesson 08) uses an uncontrolled-style approach under the hood for performance, while still giving you a controlled API.

### Vite Project Setup

Create a new React + TypeScript project with Vite:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
```

Project structure:
```
my-app/
├── index.html          ← single HTML file (Vite entry point)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/             ← static assets (favicon, images)
└── src/
    ├── main.tsx        ← React entry: renders <App /> into #root
    ├── App.tsx         ← root component
    ├── App.css         ← styles for App
    └── vite-env.d.ts   ← Vite type declarations
```

`main.tsx` mounts the React app:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

> **What is `<React.StrictMode>`?** A dev-only wrapper that **intentionally double-invokes** components, `useState` initializers, and `useEffect` setup/cleanup. The point: surface bugs that depend on a side-effect running exactly once. In production it does nothing — it's stripped from the build. You'll meet the consequence in Lesson 05: a `useEffect` that increments a counter on mount appears to run twice in dev. That's StrictMode catching unsafe effects, not a React bug. Keep StrictMode on; fix the effect.
>
> **The `!` after `getElementById('root')`** is TypeScript's non-null assertion — telling TS "I promise this isn't `null`" because the build wires the `<div id="root">` in `index.html` and TS can't see that.

## Learn More

- [React Official Docs (new)](https://react.dev/)
- [React: Describing the UI](https://react.dev/learn/describing-the-ui)
- [React: useState](https://react.dev/reference/react/useState)
- [React: Responding to Events](https://react.dev/learn/responding-to-events)
- [React: Rendering Lists](https://react.dev/learn/rendering-lists)
- [React: Controlled Components](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components)
- [Vite Guide](https://vitejs.dev/guide/)

## How to Work

1. **Study examples** — these are `.tsx` files. To run them:
   - Use your `santa-app` (or any Vite + React + TS project)
   - Copy the example file into `src/`
   - Import and render the component in `App.tsx`
   ```
   src/05-frontend/lessons/04-react-fundamentals/examples/components-and-props.tsx
   src/05-frontend/lessons/04-react-fundamentals/examples/state-and-events.tsx
   src/05-frontend/lessons/04-react-fundamentals/examples/lists-and-conditionals.tsx
   ```

   > Examples use inline `style={{...}}` for portability (drop the file in any project, it works). In your `santa-app` use the styling approach you chose in Lesson 03 — CSS Modules or Tailwind. Don't keep inline styles long-term.

2. **Complete exercises** — follow TODO comments, run in your Vite project:
   ```
   src/05-frontend/lessons/04-react-fundamentals/exercises/counter.tsx
   src/05-frontend/lessons/04-react-fundamentals/exercises/todo-list.tsx
   ```

3. **Complete the App Task** below.

## App Task

> **You already created `LoginForm`, `RegisterForm`, `RoomCard`, and `RoomList` in Lesson 03 (App Task §2 + §3) using your styling approach.** This lesson's task is to **upgrade the React mechanics inside those components** — proper controlled inputs, typed event handlers, validation logic, list-rendering with stable keys. **Don't rewrite the styling.** If a component is already in good shape from L03, mark the corresponding sub-task done and move on.

### 1. Upgrade `LoginForm` — controlled + typed + validated

Add or verify in your existing `LoginForm`:

- **Controlled inputs**: every field has `value={state}` + `onChange={(e) => setState(e.target.value)}`. No `defaultValue` here.
- **Typed event handler** for submit:
  ```tsx
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); /* ... */ };
  ```
- **Inline validation state**: a `string | null` error per field (`emailError`, `passwordError`). Update on blur or on submit. Render the error under the field.
- **Validation rules**: email contains `@` and `.`, password is 8+ chars. Real auth comes in Lesson 09 — for now, validate client-side and `console.log` the data.
- Submit button is **disabled** when there are validation errors or any field is empty.

**Verify §1:**
- [ ] Type into both fields → state updates (visible if you `console.log` or watch React DevTools).
- [ ] Submit empty → see the field-level error messages (no submission).
- [ ] Submit with bad email → email error appears, submit blocked.
- [ ] Submit with valid data → console logs the payload, no submission to a server (yet).

### 2. Upgrade `RegisterForm` — same plus password match

- Same controlled-inputs + typed-handler + per-field-error pattern.
- New rule: `confirmPassword` must equal `password`. Show «Passwords don't match» under `confirmPassword` when they differ.

**Verify §2:**
- [ ] Mismatched passwords → field-level error, submit blocked.
- [ ] Fix the mismatch → error clears.
- [ ] Submit with valid data → console logs the payload.

### 3. Upgrade `RoomCard` — typed props + status discriminated union

- Define `RoomCardProps` using a **discriminated union** so each `status` only allows the props that make sense for it:
  ```tsx
  type RoomCardProps =
    | { status: 'open';   name: string; code: string; participantCount: number; onJoin: () => void }
    | { status: 'drawn';  name: string; code: string; participantCount: number; onView: () => void }
    | { status: 'closed'; name: string; code: string; participantCount: number };  // no action
  ```
- Render the right action button (or nothing) per `status`.
- Use `React.ComponentPropsWithoutRef<'article'>` if you want callers to pass extra `<article>` attributes (`className`, `aria-*`).

**Verify §3:**
- [ ] TS rejects `<RoomCard status="closed" onJoin={...} />` (extra prop).
- [ ] TS rejects `<RoomCard status="open" />` (missing `onJoin`).
- [ ] All three statuses render with the right action (or no action for closed).

### 4. Upgrade `RoomList` — typed array + empty state + correct keys

- Props: `rooms: Room[]` and an `onJoinRoom: (id: string) => void`.
- `.map()` over `rooms` with `key={room.id}` — never the index.
- When `rooms.length === 0`, render an empty-state message with a "Create Room" button placeholder (`onClick={() => console.log('TODO: create flow')}`).

**Verify §4:**
- [ ] List with 4+ rooms renders without React `key` warnings in the console.
- [ ] Empty list → empty-state message visible.
- [ ] **Demonstrate why `key` matters** — quickest way:
  1. Add a tiny piece of state inside `RoomCard` — e.g. `const [expanded, setExpanded] = useState(false)` and a button that toggles a "more details" panel.
  2. Render the list with `key={room.id}` (your final version) — expand card #2 → reverse the array. The expanded state stays attached to the **same room** (now in a different position).
  3. Switch to `key={index}` temporarily — repeat the test. The expanded state now **stays at index 2** even though it's a different room. That's the index-key bug. Switch back to `key={room.id}`.

  For purely stateless cards the bug is invisible — but as soon as a card gains *any* state, the difference shows up.
