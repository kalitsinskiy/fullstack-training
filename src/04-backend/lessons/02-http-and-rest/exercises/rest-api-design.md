# REST API Design Exercise: Library

Design a REST API for a Library management system. The domain has three resources: **Books**, **Authors**, and **Borrowings** (a user borrows a book).

## TODO: Define the Endpoints

For each endpoint, specify:
- HTTP method
- URI path
- Brief description
- Response status codes

### Authors (example — already filled in)

| Method | URI | Description | Status Codes |
|--------|-----|-------------|--------------|
| GET | /api/authors | List all authors | 200 |
| GET | /api/authors/:id | Get author by id | 200, 404 |
| POST | /api/authors | Create author | 201, 400 |
| PATCH | /api/authors/:id | Update author partially | 200, 400, 404 |
| DELETE | /api/authors/:id | Delete author | 204, 404 |

### Books

Design the CRUD endpoints for books. Consider:
- How to list all books (with optional filters: by author, by title, by availability)
- How to handle duplicate ISBNs (what status code?)
- Whether to support partial updates (PATCH) or full replacement (PUT) — or both
- A sub-resource endpoint for "books by author"

| Method | URI | Description | Status Codes |
|--------|-----|-------------|--------------|
| | | | |

### Borrowings

Design endpoints for the borrowing flow. Think about:
- How does a user borrow a book? Is it a new resource or an action on a book?
- What happens if the book is already borrowed? (What status code?)
- How does returning a book work?
- How to list active borrowings for a user?

| Method | URI | Description | Status Codes |
|--------|-----|-------------|--------------|
| | | | |

## TODO: Answer These Design Questions

1. Should "list books by author" be `GET /api/authors/:id/books` or `GET /api/books?authorId=:id`? What are the tradeoffs?

2. How would you handle "borrow a book"? Is it `POST /api/borrowings`, `POST /api/books/:id/borrow`, or something else? Why?

3. When a user tries to borrow a book that is already borrowed, what status code should you return and why?

4. The library wants to add a "search" feature: search books by title, author name, or ISBN. Design the endpoint(s).

---

> After completing, check your answers against [rest-api-design.solution.md](rest-api-design.solution.md)
