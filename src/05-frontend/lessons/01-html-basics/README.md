# HTML Basics

## Quick Overview

HTML (HyperText Markup Language) is the skeleton of every web page. It describes the **structure** and **meaning** of content — not how it looks (that is CSS's job). A browser reads HTML, builds a DOM (Document Object Model) tree, and renders it on screen. Writing semantic, well-structured HTML is the foundation of accessibility, SEO, and maintainable frontends.

## Key Concepts

### Document Structure

Every HTML page starts with this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
</head>
<body>
  <!-- visible content goes here -->
</body>
</html>
```

- `<!DOCTYPE html>` — tells the browser this is HTML5 (always include it)
- `<html lang="en">` — root element; `lang` helps screen readers and search engines
- `<head>` — metadata: charset, viewport, title, links to CSS, meta tags
- `<body>` — everything the user sees

### Meta Tags

Meta tags live in `<head>` and provide information about the page:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Secret Santa app — organize gift exchanges">
<meta name="author" content="Your Name">
<link rel="icon" href="/favicon.ico">
```

The `viewport` meta tag is critical for mobile — without it, mobile browsers render the page at desktop width and zoom out.

### Semantic Elements

Semantic elements tell the browser (and screen readers) **what** the content is, not just how to display it:

| Element | Purpose |
|---|---|
| `<header>` | Top-level banner / logo / page-title area |
| `<nav>` | Navigation links |
| `<main>` | Primary content of the page (exactly one per page) |
| `<section>` | Thematic grouping of content (with a heading) |
| `<article>` | Self-contained piece — blog post, card, comment |
| `<aside>` | Tangentially related content (sidebar, callout) |
| `<footer>` | Bottom of the page (or of a section) |

A typical layout:

```html
<header>...</header>
<nav>...</nav>
<main>
  <section>
    <article>...</article>
    <article>...</article>
  </section>
  <aside>...</aside>
</main>
<footer>...</footer>
```

Why it matters:
- Screen readers use semantic elements to navigate the page
- Search engines rank semantic pages higher
- Code is easier to read and maintain

**Avoid `<div>` soup.** Use `<div>` only when no semantic element fits.

### Headings and Paragraphs

```html
<h1>Main Page Title</h1>        <!-- one per page -->
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<p>This is a paragraph of text.</p>
```

Rules:
- Use only **one `<h1>`** per page
- Do not skip heading levels (e.g., `<h1>` then `<h3>`) — this confuses screen readers
- Headings create an implicit document outline

### Lists

```html
<!-- Unordered list (bullets) -->
<ul>
  <li>Item A</li>
  <li>Item B</li>
</ul>

<!-- Ordered list (numbered) -->
<ol>
  <li>First step</li>
  <li>Second step</li>
</ol>

<!-- Definition list (term + description) -->
<dl>
  <dt>HTML</dt>
  <dd>HyperText Markup Language</dd>
  <dt>CSS</dt>
  <dd>Cascading Style Sheets</dd>
</dl>
```

### Links and Images

```html
<!-- Link -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Visit Example
</a>

<!-- Image -->
<img src="photo.jpg" alt="A group photo from the team party" width="600" height="400">
```

- `alt` is **required** for accessibility — describe the image content (use `alt=""` for purely decorative images, but the attribute must always be present — see the a11y section)
- `target="_blank"` opens a new tab; always pair with `rel="noopener noreferrer"` for security
- Specify `width` and `height` to prevent layout shifts while the image loads

### Responsive Images

A single `<img src>` ships the same file to every device — wasteful on mobile, blurry on retina. Use `srcset` to let the browser pick:

```html
<!-- Different files per pixel density -->
<img
  src="hero.jpg"
  srcset="hero.jpg 1x, hero@2x.jpg 2x, hero@3x.jpg 3x"
  alt="Holiday hero"
>

<!-- Different sizes per viewport width -->
<img
  src="card-400.jpg"
  srcset="card-400.jpg 400w, card-800.jpg 800w, card-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, 400px"
  alt="Room cover"
>
```

For art direction (different *crops*, not just sizes), use `<picture>`:

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-mobile.jpg">
  <source media="(max-width: 1200px)" srcset="hero-tablet.jpg">
  <img src="hero-desktop.jpg" alt="Holiday hero">
</picture>
```

Add `loading="lazy"` to images **below the fold** so the browser only fetches them when they scroll into view:

```html
<img src="below-fold.jpg" alt="..." loading="lazy" width="400" height="300">
```

> **Don't put `loading="lazy"` on the hero image** (the first big image visible on page load). It delays the largest contentful paint (LCP) — your most important performance metric — because the browser waits to discover the image is in viewport before fetching. `loading="lazy"` is for images further down the page that the user may never scroll to.

### Tables

Tables are for **tabular data only** (not for layout):

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>Developer</td>
      <td>alice@example.com</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>Designer</td>
      <td>bob@example.com</td>
    </tr>
  </tbody>
</table>
```

### Forms

Forms are how users send data. Key elements:

```html
<form action="/register" method="POST">
  <fieldset>
    <legend>Account Details</legend>

    <label for="name">Full Name</label>
    <input type="text" id="name" name="name" required placeholder="John Doe">

    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>

    <label for="password">Password</label>
    <input type="password" id="password" name="password" required minlength="8">
  </fieldset>

  <button type="submit">Register</button>
</form>
```

Common input types:
- `text`, `email`, `password`, `number`, `tel`, `url`, `date`
- `checkbox`, `radio` — must share the same `name` for radio groups
- `select` + `option` — dropdown
- `textarea` — multi-line text
- `file` — file upload (see note below)

Key rules:
- Every `<input>` needs a `<label>` with a matching `for`/`id` pair
- Use `<fieldset>` and `<legend>` to group related inputs
- `required`, `minlength`, `maxlength`, `pattern` provide built-in validation
- Use `<button type="submit">` instead of `<input type="submit">` (more flexible)

**File uploads** — `<input type="file">` requires the form to use `enctype="multipart/form-data"`, otherwise the file isn't transmitted (only its filename string is):

```html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name="avatar" accept="image/*">
  <button type="submit">Upload</button>
</form>
```

Add `multiple` for multi-file selection, `accept="image/*"` (or `.pdf,.docx`) to filter the picker.

**Static `checked` / `selected` (HTML)** — in plain HTML, `<input type="radio" checked>` and `<option selected>` set the *initial* state. This is fine for HTML mockups. In React (Lesson 04+), you write `defaultChecked`/`defaultValue` for one-time defaults, and `checked={state}` + `onChange` for fully controlled inputs.

### `id`, `class`, `data-*` — quick reference

| Attribute | Uniqueness | Use for |
|---|---|---|
| `id="…"` | Unique per document | Anchor target, `<label for>`, single-element JS handle |
| `class="a b"` | Reusable | Styling hook (one element can have many classes) |
| `data-foo="…"` | Reusable | Custom data for JS — `element.dataset.foo` (kebab-case → camelCase) |

```html
<button id="join-btn" class="btn btn-primary" data-room-id="abc123">Join</button>
<!-- JS: btn.dataset.roomId === 'abc123' -->
```

### Accessibility Basics

Accessibility (a11y) means making your page usable by everyone, including people using screen readers, keyboards, or other assistive tools.

```html
<!-- alt text for images -->
<img src="logo.png" alt="Secret Santa logo">

<!-- Decorative images get an EMPTY alt — but the attribute must be PRESENT.
     Omitting alt entirely makes screen readers fall back to reading the file path. -->
<img src="decoration.png" alt="">

<!-- aria-label for elements without visible text -->
<button aria-label="Close dialog">×</button>

<!-- aria-hidden hides from screen readers (decorative only) -->
<span aria-hidden="true">|</span>

<!-- role attribute (use semantic elements instead when possible) -->
<div role="navigation">...</div>
```

Best practices:
- Use semantic HTML first — it is inherently accessible
- All interactive elements (`<a>`, `<button>`, `<input>`) must be reachable by keyboard
- Use `<label>` for every form input
- Color alone should not be the only way to convey information

## Learn More

- [MDN: HTML Basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics)
- [MDN: Structuring the Web](https://developer.mozilla.org/en-US/docs/Learn/HTML)
- [MDN: HTML Forms](https://developer.mozilla.org/en-US/docs/Learn/Forms)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)
- [HTML Validator](https://validator.w3.org/)

## How to Work

1. **Study examples** — open them directly in your browser:
   ```
   src/05-frontend/lessons/01-html-basics/examples/semantic-page.html
   src/05-frontend/lessons/01-html-basics/examples/forms.html
   src/05-frontend/lessons/01-html-basics/examples/tables-and-lists.html
   ```

2. **Complete exercises** — open in your editor, follow TODO comments, then open in a browser to verify:
   ```
   src/05-frontend/lessons/01-html-basics/exercises/registration-page.html
   src/05-frontend/lessons/01-html-basics/exercises/product-catalog.html
   ```

3. **Complete the App Task** below.

## App Task

### 1. Initialize santa-app

```bash
npm create vite@latest santa-app -- --template react-ts
cd santa-app
npm install
npm run dev    # should open on http://localhost:5173
```

Explore the generated project structure:
- `index.html` — the single HTML file (Vite's entry point)
- `src/main.tsx` — React entry point
- `src/App.tsx` — root component
- `vite.config.ts` — Vite configuration

### 2. Create Static HTML Mockups

Place the files in `santa-app/public/mockups/` — Vite serves anything in `public/` as a static asset at the root URL.

**`login.html`** — a login page with:
- `<title>` "Secret Santa — Login"
- Semantic structure: `<header>` (with `<h1>` "Secret Santa") → `<main>` → `<footer>`
- `<main>` contains an `<h2>` "Welcome Back"
- A `<form method="POST" action="/auth/login">` with a `<fieldset>` + `<legend>` "Sign in":
  - email input (`type="email"`, `required`, `<label>`, `id`/`for` matching, `name`, `placeholder`)
  - password input (`type="password"`, `required`, `minlength="8"`, `<label>`, ...)
  - `<button type="submit">` "Sign In"
- A link "Don't have an account? Register" pointing to `register.html`

**`register.html`** — a registration page with:
- `<title>` "Secret Santa — Register"
- Same `<header>` / `<main>` / `<footer>` structure
- `<main>` contains an `<h2>` "Create Account"
- A `<form method="POST" action="/auth/register">` with a `<fieldset>` + `<legend>` "Account details":
  - name (`type="text"`, `required`)
  - email (`type="email"`, `required`)
  - password (`type="password"`, `required`, `minlength="8"`)
  - confirm password (`type="password"`, `required`, `minlength="8"`)
  - submit button "Create Account"
- A link "Already have an account? Sign in" pointing to `login.html`

> Match what `exercises/registration-page.html` already trained — `<fieldset>` + `<legend>`, every input labeled, validation attributes set. Same standard everywhere in the course.

### 3. View the mockups

Two ways:

```bash
# Recommended: serve via the Vite dev server
cd santa-app
npm run dev
# Open http://localhost:5173/mockups/login.html
#      http://localhost:5173/mockups/register.html
```

Or open the file directly: double-click `login.html` in your file manager → opens as `file:///…/login.html`. Works for static HTML, but no live reload and some features (e.g. `fetch`) misbehave under `file://`. Prefer the dev-server route.

These are throwaway mockups — we'll rebuild them as React components in Lessons 03-08. The goal here is to practice HTML structure in isolation, before CSS and JavaScript.
