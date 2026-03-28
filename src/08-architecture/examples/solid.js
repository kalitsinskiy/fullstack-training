// ============================================
// SOLID PRINCIPLES — JavaScript examples
// ============================================

// ============================================
// S — Single Responsibility Principle
// ============================================
// "A class should have one, and only one, reason to change."

// ❌ VIOLATION: this class does too many things
class UserServiceBad {
  saveUser(user) {
    // 1. validate
    if (!user.email.includes('@')) throw new Error('Invalid email');
    // 2. persist to DB
    console.log(`DB: INSERT user ${user.email}`);
    // 3. send email
    console.log(`Email: Welcome ${user.email}!`);
    // 4. log
    console.log(`LOG: user created ${user.email}`);
  }
}
// Reason to change: validation rules change → edit this class
// Reason to change: DB changes → edit this class
// Reason to change: email template changes → edit this class
// Reason to change: log format changes → edit this class

// ✅ CORRECT: each class has ONE responsibility
class UserValidator {
  validate(user) {
    if (!user.email?.includes('@')) throw new Error('Invalid email');
    if (!user.name || user.name.length < 2) throw new Error('Name too short');
  }
}

class UserRepository {
  save(user) { console.log(`DB: INSERT user ${user.email}`); }
  findById(id) { console.log(`DB: SELECT user ${id}`); }
}

class EmailService {
  sendWelcome(user) { console.log(`Email: Welcome ${user.email}!`); }
}

class AuditLogger {
  log(action, data) { console.log(`LOG [${action}]: ${JSON.stringify(data)}`); }
}

class UserService {
  #validator = new UserValidator();
  #repo = new UserRepository();
  #email = new EmailService();
  #logger = new AuditLogger();

  createUser(user) {
    this.#validator.validate(user);
    this.#repo.save(user);
    this.#email.sendWelcome(user);
    this.#logger.log('user:create', { email: user.email });
  }
}

console.log('=== SRP ===');
const us = new UserService();
us.createUser({ name: 'Alice', email: 'alice@example.com' });

// ============================================
// O — Open/Closed Principle
// ============================================
// "Open for extension, closed for modification."
// Add new behavior WITHOUT changing existing code.

// ❌ VIOLATION: adding a new discount type requires modifying this function
function calculateDiscountBad(type, price) {
  if (type === 'percent') return price * 0.9;
  if (type === 'fixed')   return price - 10;
  // Adding 'bulk'? Need to edit this function — violates OCP
  if (type === 'bulk')    return price * 0.75;
}

// ✅ CORRECT: extend by adding new classes, not modifying existing
class PercentDiscount {
  apply(price) { return price * 0.9; }
}

class FixedDiscount {
  apply(price) { return Math.max(0, price - 10); }
}

class BulkDiscount {
  apply(price) { return price * 0.75; }
}

// New discount? Just add a new class — existing code untouched:
class LoyaltyDiscount {
  #multiplier;
  constructor(multiplier) { this.#multiplier = multiplier; }
  apply(price) { return price * this.#multiplier; }
}

function calculateDiscount(discount, price) {
  return discount.apply(price); // works with ANY discount — open for extension
}

console.log('\n=== OCP ===');
console.log(calculateDiscount(new PercentDiscount(), 100)); // 90
console.log(calculateDiscount(new BulkDiscount(), 100));    // 75
console.log(calculateDiscount(new LoyaltyDiscount(0.85), 100)); // 85

// ============================================
// L — Liskov Substitution Principle
// ============================================
// "Subtypes must be substitutable for their base types."
// If S extends T, then T can be replaced by S without breaking the program.

// ❌ VIOLATION: Square breaks Rectangle's contract
class Rectangle {
  constructor(w, h) { this.width = w; this.height = h; }
  setWidth(w) { this.width = w; }
  setHeight(h) { this.height = h; }
  area() { return this.width * this.height; }
}

class Square extends Rectangle {
  setWidth(w)  { this.width = w; this.height = w; } // breaks LSP!
  setHeight(h) { this.width = h; this.height = h; } // width silently changes
}

function resizeAndCheck(rect) {
  rect.setWidth(5);
  rect.setHeight(10);
  return rect.area(); // expect 50
}

console.log('\n=== LSP ===');
console.log(resizeAndCheck(new Rectangle(0, 0))); // 50 ✅
console.log(resizeAndCheck(new Square(0)));        // 100 ❌ — Square breaks the contract

// ✅ Fix: don't inherit Square from Rectangle — separate concepts
class Shape {
  area() { throw new Error('Not implemented'); }
}

class RectangleShape extends Shape {
  constructor(w, h) { super(); this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}

class SquareShape extends Shape {
  constructor(side) { super(); this.side = side; }
  area() { return this.side ** 2; }
}

// Both are substitutable for Shape:
[new RectangleShape(4, 5), new SquareShape(4)].forEach(s => {
  console.log(s.area()); // 20, 16 — both work correctly
});

// ============================================
// D — Dependency Inversion Principle
// ============================================
// "Depend on abstractions, not concretions."
// High-level modules should not depend on low-level modules.

// ❌ VIOLATION: OrderService is coupled to MySQL directly
class MySQLOrderRepository {
  save(order) { console.log(`MySQL: saving order ${order.id}`); }
}

class OrderServiceBad {
  #repo = new MySQLOrderRepository(); // hard-coded dependency!

  placeOrder(order) {
    // To test this or switch to Postgres, you MUST change OrderServiceBad
    this.#repo.save(order);
  }
}

// ✅ CORRECT: depend on abstraction (interface), inject the implementation
class OrderService {
  #repo; // any object with .save(order)

  constructor(repo) { // inject dependency
    this.#repo = repo;
  }

  placeOrder(order) {
    this.#repo.save(order); // doesn't care WHAT repo is
  }
}

// Now you can inject ANY implementation:
class PostgresOrderRepository {
  save(order) { console.log(`Postgres: saving order ${order.id}`); }
}

class InMemoryOrderRepository {
  #orders = [];
  save(order) { this.#orders.push(order); console.log('Memory: saved'); }
  all() { return this.#orders; }
}

console.log('\n=== DIP ===');
const memRepo = new InMemoryOrderRepository();
const service = new OrderService(memRepo); // inject
service.placeOrder({ id: 1, total: 99 });

// For tests — inject a fake:
const fakeRepo = { save: (o) => console.log(`FAKE: order ${o.id} saved`) };
const testService = new OrderService(fakeRepo);
testService.placeOrder({ id: 2, total: 50 });

// Switch to Postgres without touching OrderService:
const prodService = new OrderService(new PostgresOrderRepository());
prodService.placeOrder({ id: 3, total: 199 });
