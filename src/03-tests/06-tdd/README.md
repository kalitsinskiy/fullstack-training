# TDD — Test-Driven Development

## Red → Green → Refactor

TDD is a development workflow where you write the **test before the code**.

```
    🔴 RED
    Write a failing test
    (the feature doesn't exist yet)
         ↓
    🟢 GREEN
    Write the MINIMUM code to make it pass
    (don't over-engineer, just make it pass)
         ↓
    🔵 REFACTOR
    Clean up the code
    (rename, extract, simplify — without breaking tests)
         ↓
    (repeat for the next feature)
```

## Step-by-step Example

**Task:** Implement `capitalize(str)` — capitalizes the first letter.

### Step 1 — RED: Write the test first
```typescript
test('capitalizes first letter', () => {
  expect(capitalize('hello')).toBe('Hello');
});
```
Run → **FAILS** (capitalize doesn't exist yet). ✅ That's expected!

### Step 2 — GREEN: Write minimum code to pass
```typescript
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```
Run → **PASSES**. 🟢

### Step 3 — REFACTOR: Are there edge cases?
```typescript
test('empty string returns empty', () => {
  expect(capitalize('')).toBe('');
});

test('already capitalized stays the same', () => {
  expect(capitalize('Hello')).toBe('Hello');
});
```
Run → **PASSES** (existing implementation handles these). ✅

## When to use TDD

### ✅ Good fit
- Business logic with clear requirements (calculations, transformations)
- Bug fixes — first write a test that reproduces the bug, then fix it
- Refactoring — tests give you confidence nothing broke
- APIs and utilities with well-defined contracts

### ❌ Not a great fit
- UI/styling — hard to write tests before you see it
- Exploratory/prototyping code — you don't know the API yet
- Database migrations — usually integration tests, not unit TDD
- Third-party integrations during initial setup

## Why TDD?

1. **Forces you to think about the API first** — what should the function do, not how
2. **Built-in regression tests** — every bug you fix gets a test
3. **Small commits, clear history** — each test+implementation is one focused change
4. **Design feedback** — if the test is hard to write, the code is too coupled
5. **Confidence to refactor** — green tests = nothing is broken

## The Exercise

`string-utils.test.ts` has tests written for you.
`string-utils.ts` has empty function stubs.

1. Run `npx jest src/03-tests/06-tdd` — all tests should be **RED** (failing)
2. Implement each function in `string-utils.ts` one by one
3. After each implementation, run the tests
4. When all tests are **GREEN** — you're done
5. Look for anything to refactor (edge cases, code quality)

This is the TDD experience: tests first, implementation second.
