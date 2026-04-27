# Software Architecture

## SOLID Principles

| Letter | Principle | Core idea |
|--------|-----------|-----------|
| **S** | Single Responsibility | A class/function should have one reason to change |
| **O** | Open/Closed | Open for extension, closed for modification |
| **L** | Liskov Substitution | Subtypes must be substitutable for their base types |
| **I** | Interface Segregation | Don't force code to depend on methods it doesn't use |
| **D** | Dependency Inversion | Depend on abstractions, not concrete implementations |

## Architectural Patterns

### MVC (Model-View-Controller)
- **Model** — data, business logic, database
- **View** — UI, templates, presentation
- **Controller** — handles requests, orchestrates Model + View
- Used in: Express, Rails, Laravel

### Layered Architecture (N-tier)
```
┌─────────────────────┐
│   Presentation      │ ← HTTP handlers, CLI, UI
├─────────────────────┤
│   Application       │ ← Use cases, orchestration
├─────────────────────┤
│   Domain            │ ← Business logic, entities, rules
├─────────────────────┤
│   Infrastructure    │ ← DB, external APIs, file system
└─────────────────────┘
```
Rule: dependencies only point **downward**. Domain never imports Infrastructure.

### Clean Architecture (Uncle Bob)
- **Entities** — enterprise business rules
- **Use Cases** — application business rules
- **Interface Adapters** — controllers, presenters, gateways
- **Frameworks & Drivers** — DB, web framework, UI

Key rule: The **Dependency Rule** — source code dependencies point inward only.

## REST API Design

| Principle | Example |
|-----------|---------|
| Resource URLs, not actions | `/users`, not `/getUsers` |
| HTTP verbs for actions | GET, POST, PUT/PATCH, DELETE |
| Plural nouns | `/users`, `/products` |
| Nested for relationships | `/users/42/orders` |
| HTTP status codes | 200, 201, 400, 401, 404, 500 |
| Versioning | `/api/v1/users` |

## Domain-Driven Design (DDD) Basics

- **Entity** — has identity (id), can change (User, Order)
- **Value Object** — no identity, defined by value (Money, Address)
- **Repository** — collection-like interface for persistence
- **Service** — stateless domain logic that doesn't fit in entities
- **Aggregate** — cluster of entities with a root (Order + OrderItems)

## Learn More

- [The Clean Architecture (Uncle Bob's blog)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles explained](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [REST API Design Best Practices](https://restfulapi.net/)
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/)
