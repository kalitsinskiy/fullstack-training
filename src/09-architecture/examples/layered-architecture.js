// ============================================
// LAYERED ARCHITECTURE — JavaScript example
// ============================================
// Simulates a real app without a framework.
// Dependency direction: Presentation → Application → Domain ← (no) Infrastructure
// Domain never imports anything from outer layers.

// ============================================
// Layer 1: Domain — business entities and rules
// (no dependencies on other layers)
// ============================================

class User {
  #id;
  #name;
  #email;
  #createdAt;

  constructor({ id, name, email }) {
    if (!email.includes('@')) throw new Error('Invalid email');
    if (name.length < 2)     throw new Error('Name too short');
    this.#id = id;
    this.#name = name;
    this.#email = email;
    this.#createdAt = new Date();
  }

  get id()    { return this.#id; }
  get name()  { return this.#name; }
  get email() { return this.#email; }

  toJSON() {
    return { id: this.#id, name: this.#name, email: this.#email };
  }

  changeName(newName) {
    if (newName.length < 2) throw new Error('Name too short');
    this.#name = newName;
  }
}

// Domain service: logic that doesn't belong in User
class UserDomainService {
  static isEmailAvailable(email, existingUsers) {
    return !existingUsers.some(u => u.email === email);
  }
}

// ============================================
// Layer 2: Infrastructure — persistence, external
// (implements interfaces defined by Application layer)
// ============================================

class InMemoryUserRepo {
  #storage = new Map();
  #nextId = 1;

  save(user) {
    this.#storage.set(user.id, user);
    return user;
  }

  findById(id) {
    return this.#storage.get(id) ?? null;
  }

  findByEmail(email) {
    return [...this.#storage.values()].find(u => u.email === email) ?? null;
  }

  findAll() {
    return [...this.#storage.values()];
  }

  nextId() { return this.#nextId++; }
}

class ConsoleNotifier {
  sendWelcome(user) {
    console.log(`Email: Welcome email sent to ${user.email}`);
  }
}

// ============================================
// Layer 3: Application — use cases (orchestration)
// Depends on: Domain + Infrastructure interfaces
// ============================================

class CreateUserUseCase {
  #repo;
  #notifier;

  constructor(repo, notifier) {
    this.#repo = repo;
    this.#notifier = notifier;
  }

  execute({ name, email }) {
    const allUsers = this.#repo.findAll();

    if (!UserDomainService.isEmailAvailable(email, allUsers)) {
      throw new Error(`Email ${email} is already taken`);
    }

    const user = new User({ id: this.#repo.nextId(), name, email });
    this.#repo.save(user);
    this.#notifier.sendWelcome(user);

    return user.toJSON();
  }
}

class GetUserUseCase {
  #repo;

  constructor(repo) { this.#repo = repo; }

  execute(id) {
    const user = this.#repo.findById(id);
    if (!user) throw new Error(`User ${id} not found`);
    return user.toJSON();
  }
}

// ============================================
// Layer 4: Presentation — HTTP handlers (simulated)
// Depends on: Application layer only
// ============================================

class UserController {
  #createUser;
  #getUser;

  constructor(createUser, getUser) {
    this.#createUser = createUser;
    this.#getUser = getUser;
  }

  handleCreate(req) {
    try {
      const user = this.#createUser.execute(req.body);
      return { status: 201, body: user };
    } catch (err) {
      const status = err.message.includes('taken') ? 409 : 400;
      return { status, body: { error: err.message } };
    }
  }

  handleGet(req) {
    try {
      const user = this.#getUser.execute(req.params.id);
      return { status: 200, body: user };
    } catch (err) {
      return { status: 404, body: { error: err.message } };
    }
  }
}

// ============================================
// Wiring (composition root — usually index.js)
// ============================================
const repo     = new InMemoryUserRepo();
const notifier = new ConsoleNotifier();

const createUserUseCase = new CreateUserUseCase(repo, notifier);
const getUserUseCase    = new GetUserUseCase(repo);
const controller        = new UserController(createUserUseCase, getUserUseCase);

// ============================================
// Demo — simulated HTTP requests
// ============================================
console.log('=== Layered Architecture Demo ===\n');

let response;

response = controller.handleCreate({ body: { name: 'Alice', email: 'alice@example.com' } });
console.log('POST /users:', response);

response = controller.handleCreate({ body: { name: 'Bob', email: 'bob@example.com' } });
console.log('POST /users:', response);

response = controller.handleCreate({ body: { name: 'Charlie', email: 'alice@example.com' } }); // duplicate
console.log('POST /users (duplicate):', response);

response = controller.handleGet({ params: { id: 1 } });
console.log('GET /users/1:', response);

response = controller.handleGet({ params: { id: 99 } });
console.log('GET /users/99:', response);

response = controller.handleCreate({ body: { name: 'X', email: 'bademail' } }); // invalid
console.log('POST /users (invalid):', response);
