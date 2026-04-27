// ============================================
// ARCHITECTURE — Exercises
// ============================================

// ---
// Exercise 1: SRP violation — refactor
// The class below does too many things.
// Split it into separate classes with single responsibilities.

class ReportGeneratorBad {
  generateReport(data) {
    // Step 1: filter
    const filtered = data.filter(item => item.active);

    // Step 2: compute stats
    const total = filtered.reduce((s, i) => s + i.value, 0);
    const avg = total / filtered.length;

    // Step 3: format as HTML
    const html = `<h1>Report</h1><p>Total: ${total}, Avg: ${avg}</p>`;

    // Step 4: save to file (simulated)
    console.log('FILE: writing report.html');

    return html;
  }
}

// TODO: split into:
// - DataFilter   — filter(data) → filtered items
// - StatsCalc    — calculate(items) → { total, avg }
// - HtmlFormatter — format(stats) → html string
// - ReportWriter  — write(html) → saves to file
// - ReportGenerator — orchestrates all 4

// ---
// Exercise 2: OCP — add new notification channel without modifying existing code
// Currently only email notifications exist.
// Add SMS and Slack without touching NotificationService.

class EmailNotifier {
  send(user, message) {
    console.log(`Email to ${user.email}: ${message}`);
  }
}

class NotificationService {
  #notifiers;

  constructor(notifiers) {
    this.#notifiers = notifiers;
  }

  notify(user, message) {
    // TODO: send via all notifiers
  }
}

// TODO: Create SmsNotifier and SlackNotifier classes
// Then use: new NotificationService([emailNotifier, smsNotifier, slackNotifier])

const ns = new NotificationService([new EmailNotifier() /*, TODO: add more */]);
ns.notify({ email: 'alice@example.com', phone: '+380991234567', slack: '@alice' }, 'Hello!');
// Expected:
// Email to alice@example.com: Hello!
// SMS to +380991234567: Hello!
// Slack to @alice: Hello!

// ---
// Exercise 3: DIP — decouple UserService from storage
// Make UserService work with any storage (in-memory, file, DB).

// TODO: Create an interface (contract) — any object with save(user) and findById(id)
// TODO: Create InMemoryStorage implementing that contract
// TODO: Rewrite UserService to accept storage via constructor (injection)

class UserServiceTodo {
  // ❌ currently hard-coded to in-memory object:
  #users = {};

  create(user) {
    this.#users[user.id] = user;
    return user;
  }

  getById(id) {
    return this.#users[id] ?? null;
  }
}

// After refactoring:
// const memStorage = new InMemoryStorage();
// const userService = new UserService(memStorage);
// userService.create({ id: 1, name: 'Alice' });
// console.log(userService.getById(1)); // { id: 1, name: 'Alice' }

// ---
// Exercise 4: Repository pattern
// Implement a ProductRepository that abstracts data access.
// The application layer should never write raw data operations.

const productsData = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
  { id: 2, name: 'Desk',   price: 350, category: 'Furniture' },
  { id: 3, name: 'Phone',  price: 699, category: 'Electronics' },
];

class ProductRepository {
  // TODO: implement
  // findAll() → all products
  // findById(id) → product or null
  // findByCategory(category) → array
  // save(product) → saved product (with auto-id if new)
  // delete(id) → boolean
}

const repo = new ProductRepository();
// console.log(repo.findAll().length);            // 3
// console.log(repo.findById(2).name);            // 'Desk'
// console.log(repo.findByCategory('Electronics').length); // 2
// const newProduct = repo.save({ name: 'Chair', price: 199, category: 'Furniture' });
// console.log(newProduct.id); // 4 (auto-assigned)

// ---
// Challenge: Mini MVC
// Implement a minimal MVC for a todo list.
// Model: stores todos, notifies observers on change
// View: renders todos to console
// Controller: handles commands (add, complete, delete)

// Expected usage:
// const model = new TodoModel();
// const view = new TodoView(model);
// const controller = new TodoController(model);
//
// controller.addTodo('Buy groceries');
// controller.addTodo('Write tests');
// controller.completeTodo(1);
// controller.deleteTodo(2);
//
// Output (view renders automatically when model changes):
// [1] ✅ Buy groceries
