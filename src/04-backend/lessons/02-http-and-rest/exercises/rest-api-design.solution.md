# REST API Design Exercise: Library — Solution

## Books

| Method | URI | Description | Status Codes |
|--------|-----|-------------|--------------|
| GET | /api/books | List books (?authorId=, ?title=, ?available=) | 200 |
| GET | /api/books/:id | Get book by id | 200, 404 |
| POST | /api/books | Create book | 201, 400, 409 (dup ISBN) |
| PUT | /api/books/:id | Replace book entirely | 200, 400, 404 |
| PATCH | /api/books/:id | Update book partially | 200, 400, 404 |
| DELETE | /api/books/:id | Delete book | 204, 404 |
| GET | /api/authors/:id/books | Books by author (sub-resource) | 200, 404 |

> Note: both PUT and PATCH are shown here to illustrate the difference. PUT requires sending *all* fields (replaces the resource), while PATCH only sends the fields to update. In practice, many APIs only implement PATCH for updates.

## Borrowings

| Method | URI | Description | Status Codes |
|--------|-----|-------------|--------------|
| POST | /api/books/:id/borrow | Borrow a book | 201, 404, 409 (already borrowed) |
| POST | /api/books/:id/return | Return a book | 200, 404, 400 (not borrowed) |
| GET | /api/borrowings?userId=:id | Active borrowings for user | 200 |

## Design Questions

### 1. Sub-resource vs query param for "books by author"

Both are valid. Sub-resource (`/authors/:id/books`) reads naturally and makes the relationship explicit. Query param (`/books?authorId=`) is more flexible — one endpoint handles all filtering. I'd support both.

### 2. How to handle "borrow a book"

`POST /api/books/:id/borrow` — it's an action on a book, matches the user's intent. More intuitive than creating a "borrowing" resource directly.

### 3. Status code for "already borrowed"

409 Conflict — the request is valid but conflicts with current state (book is already checked out). More precise than 400 (which implies the request itself is malformed).

### 4. Search endpoint

`GET /api/books?search=<query>` — single param that searches across title, author name, ISBN. Add `?page=1&limit=20` for pagination.
