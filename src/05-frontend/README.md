# Frontend Development

## Prerequisites

Before starting this section, you should have completed:

- **Block 1**: JavaScript Basics
- **Block 2**: TypeScript
- **Block 3**: Testing with Jest

## What You'll Learn

- HTML5 — semantic elements, forms, accessibility, responsive media
- CSS — box model, flexbox, grid, **mobile-first responsive design** (media queries, container queries, fluid typography)
- Styling React — **CSS Modules vs Tailwind vs Styled Components** (with side-by-side comparison)
- React 18/19 — components, props, state, hooks, JSX, **TypeScript-first** patterns
- State management — `useState`, `useReducer`, `useContext`, custom hooks, when to reach for Zustand
- Routing — **React Router v7** (primary), TanStack Router (typed alternative)
- UI Components — Material UI (existing-codebase choice) and Tailwind + shadcn/ui (modern default)
- Forms — **React Hook Form + Zod** (validation, types from schema)
- Data fetching — manual `fetch` foundation **then TanStack Query** (cache, dedup, mutations, devtools)
- Advanced React — `Suspense`, `lazy`, **Error Boundaries**, `useTransition`, `useDeferredValue`, `useId`, **`useOptimistic`**, **`useActionState`** / `useFormStatus`, code splitting
- React DevTools + Profiler walkthrough
- Testing — **Vitest + MSW** + React Testing Library

## Course Philosophy

Each lesson teaches the **modern way first**, then explains the **manual / legacy way** so you understand what the abstraction is doing under the hood. Two reasons:
1. Code reviews — you will see both styles in real codebases.
2. Trade-offs — choosing between approaches requires knowing both.

## Course Structure

Each lesson contains:
- **README.md** — theory, concepts, code snippets, links
- **examples/** — working runnable code
- **exercises/** — TODO-based standalone exercises (use `it.todo`-style markers so progress is visible)

Most lessons include an **App Task** — a concrete piece of the Secret Santa frontend (`santa-app` at the repo root). The app builds gradually; later lessons retroactively refactor earlier work to the modern stack (e.g. Lesson 08 rewrites the manual forms from Lesson 04 with RHF + Zod).

### Lessons

| # | Topic | Tech | Description |
|----|-------|------|-------------|
| 01 | [HTML Basics](lessons/01-html-basics/) | HTML5, semantic, forms, a11y | Document structure, semantic elements, forms, responsive images |
| 02 | [CSS Essentials & Responsive](lessons/02-css-basics/) | Flexbox, Grid, media queries, container queries | Box model, layout, units, **mobile-first**, container queries, `clamp()` |
| 03 | [Styling in React](lessons/03-css-advanced/) | CSS Modules, Tailwind, Styled Components | Same component built three ways; trade-offs and recommendation |
| 04 | [React Fundamentals](lessons/04-react-fundamentals/) | React 18, JSX, useState, Vite | Components, props, events, conditional/list rendering, **TS-first patterns** |
| 05 | [React Hooks & State](lessons/05-react-hooks-and-state/) | useEffect, useContext, custom hooks, AbortController | Side effects, global state, custom hooks, **Zustand** mention for when Context is too heavy |
| 06 | [React Router](lessons/06-react-router/) | React Router v7 | Client routing, protected routes, nested layouts, brief tour of TanStack Router |
| 07 | [UI Components](lessons/07-ui-components/) | MUI, Tailwind, shadcn/ui | When to use a component library vs utility-first; same UI compared |
| 08 | [Forms with RHF + Zod](lessons/08-forms-rhf-zod/) | React Hook Form, Zod, React 19 actions | Form schemas, typed inputs, async validation, mention of `useActionState` |
| 09 | [Data Fetching](lessons/09-data-fetching/) | fetch → TanStack Query | Manual fetch first, then TanStack Query — what it adds and why |
| 10 | [Advanced React](lessons/10-advanced-react/) | Suspense, lazy, Error Boundaries, useTransition, useOptimistic, DevTools | Performance, async UI, error handling, React DevTools + Profiler |
| 11 | [Testing React](lessons/11-testing-react/) | Vitest, MSW, RTL | Component, hook, form, and route tests with mocked API |

### App Tasks Arc

You build `santa-app` (React + Vite + TypeScript) gradually:

| Lessons | What you add to santa-app |
|---|---|
| 01-02 | Static HTML mockups, then CSS layout |
| 03 | App-wide styling stack (CSS Modules or Tailwind) |
| 04 | First React components — Login/Register forms (manual) |
| 05 | AuthContext + JWT in localStorage + API request hook |
| 06 | Routing + protected routes + layout |
| 07 | UI library wired in (whichever you chose in Lesson 03) |
| 08 | **Refactor Lesson 04 forms to RHF + Zod** |
| 09 | **Replace manual fetch with TanStack Query** for read paths |
| 10 | Error boundaries, code splitting, optimistic UI for one mutation |
| 11 | Component + integration tests for the auth and rooms flows |

The app lives at `/santa-app` (port 5173) and talks to `santa-api` (port 3001).

## How to Work

1. Read the lesson **README.md** for theory
2. Study **examples/** — open HTML files in the browser, run React examples in your Vite project
3. Complete **exercises/** by replacing TODOs with your code
4. Complete the **App Task** described at the bottom of each README

## Tech Stack — at a glance

| Category | Primary choice | Alternative shown |
|---|---|---|
| Framework | React 18/19 + Vite + TypeScript | — |
| Styling | **CSS Modules** *or* **Tailwind** | Styled Components (legacy/CSS-in-JS) |
| Routing | React Router v7 | TanStack Router (typed routes) |
| UI components | Material UI **or** Tailwind + shadcn/ui | — |
| Forms | React Hook Form + Zod | manual `useState` (Lesson 04 baseline) |
| Data fetching | TanStack Query | raw `fetch` + `useEffect` (Lesson 09 baseline) |
| Testing | Vitest + RTL + MSW | Jest (legacy projects) |
| Production concerns | env via `VITE_*`, build via `vite build`, deploy to Vercel/Netlify (covered briefly in Lessons 09 + 11) | — |
