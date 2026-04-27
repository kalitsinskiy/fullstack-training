# Frontend Development

## Prerequisites

Before starting this section, you should have completed:

- **Block 1**: JavaScript Basics (14 lessons)
- **Block 2**: TypeScript (6 lessons)
- **Block 3**: Testing with Jest (6 lessons)

## What You'll Learn

- HTML5 fundamentals — semantic elements, forms, accessibility
- CSS from scratch — box model, flexbox, grid, responsive design
- Modular CSS approaches — CSS Modules, Styled Components
- React 18 — components, props, state, hooks, JSX
- State management — useContext, custom hooks, Context API
- Routing — React Router v6, protected routes, layouts
- Component libraries — Material UI (MUI), theming
- Connecting frontend to REST APIs — fetch, loading/error states
- Testing React — React Testing Library, mocking

## Course Structure

Each lesson contains:
- **README.md** — Theory, concepts, code snippets, links to resources
- **QUESTIONS.md** — 5-8 evaluation questions
- **examples/** — Working runnable code demonstrating concepts
- **exercises/** — TODO-based standalone exercises

Most lessons also include an **App Task** — a concrete task to implement in the Secret Santa frontend (`santa-app` at the repo root). You build the app gradually as you progress.

### Lessons

| #  | Topic | Technologies | Description |
|----|-------|-------------|-------------|
| 01 | [HTML Basics](lessons/01-html-basics/) | HTML5, semantic elements, forms | Document structure, tags, forms, attributes, accessibility |
| 02 | [CSS Basics](lessons/02-css-basics/) | Box model, flexbox, grid, positioning | Selectors, specificity, units, flex/grid layout |
| 03 | [CSS Advanced](lessons/03-css-advanced/) | Media queries, CSS Modules, Styled Components | Responsive design, modular CSS, CSS-in-JS |
| 04 | [React Fundamentals](lessons/04-react-fundamentals/) | React 18, JSX, useState, Vite | Components, props, events, conditional/list rendering |
| 05 | [React Hooks & State](lessons/05-react-hooks-and-state/) | useEffect, useContext, custom hooks | Side effects, global state, Context API, custom hooks |
| 06 | [React Router & MUI](lessons/06-react-router-and-mui/) | React Router v6, Material UI | Client routing, protected routes, layouts, MUI components |
| 07 | [Connecting to API](lessons/07-connecting-to-api/) | fetch/axios, API service layer | REST consumption, loading/error states, API patterns |
| 08 | [Testing React](lessons/08-testing-react/) | React Testing Library, Jest | Component testing, mocking API, testing hooks |

### App Tasks

As you progress through lessons, you gradually build the Secret Santa frontend:

**santa-app** (React + Vite + TypeScript) — port 5173
- Login/register pages (lessons 01-05)
- Room dashboard, room detail pages (lessons 06-07)
- Full API integration (lesson 07)
- Component tests (lesson 08)

The app lives at the repo root (`/santa-app`).

## How to Work

1. Read the lesson **README.md** for theory
2. Study **examples/** — open HTML files in browser or run React examples
3. Complete **exercises/** by replacing TODO comments with your code
4. Complete the **App Task** described at the bottom of each README
5. Answer **QUESTIONS.md** for self-evaluation

## Tech Stack

| Category | Technology | Lesson |
|----------|-----------|--------|
| Markup | HTML5, semantic elements | 01 |
| Styling | CSS3, Flexbox, Grid | 02 |
| CSS Architecture | CSS Modules, Styled Components | 03 |
| Framework | React 18, Vite, TypeScript | 04 |
| State | useState, useContext, custom hooks | 05 |
| Routing | React Router v6 | 06 |
| UI Library | Material UI (MUI) | 06 |
| API | fetch/axios, API service layer | 07 |
| Testing | React Testing Library, Jest | 08 |
