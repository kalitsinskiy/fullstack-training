// ============================================
// BEHAVIORAL PATTERNS
// ============================================

// ============================================
// 1. Observer — one-to-many event notification
// ============================================
// Use cases: event systems, UI state, reactive data, real-time updates

class EventEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(listener);
    return () => this.off(event, listener); // return unsubscribe fn
  }

  off(event, listener) {
    this.#listeners.get(event)?.delete(listener);
  }

  emit(event, ...args) {
    this.#listeners.get(event)?.forEach(listener => listener(...args));
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

console.log('=== Observer / EventEmitter ===');
const emitter = new EventEmitter();

const unsubscribe = emitter.on('data', (payload) => {
  console.log('Listener 1:', payload);
});

emitter.on('data', (payload) => {
  console.log('Listener 2:', payload);
});

emitter.once('connect', () => {
  console.log('Connected! (fires once only)');
});

emitter.emit('data', { id: 1 });     // both listeners fire
emitter.emit('connect');              // fires
emitter.emit('connect');              // ignored — already removed
unsubscribe();
emitter.emit('data', { id: 2 });     // only listener 2 fires

// ============================================
// 2. Strategy — swap algorithms at runtime
// ============================================
// Use cases: sorting/filtering, payment methods, validation rules, compression

class Sorter {
  #strategy;

  constructor(strategy) {
    this.#strategy = strategy;
  }

  setStrategy(strategy) {
    this.#strategy = strategy;
  }

  sort(data) {
    return this.#strategy([...data]); // don't mutate original
  }
}

// Strategies
const bubbleStrategy = (arr) => {
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length - i - 1; j++)
      if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
  return arr;
};

const nativeStrategy = (arr) => arr.sort((a, b) => a - b);
const reverseStrategy = (arr) => arr.sort((a, b) => b - a);

console.log('\n=== Strategy ===');
const sorter = new Sorter(nativeStrategy);
console.log(sorter.sort([3, 1, 4, 1, 5]));  // [1, 1, 3, 4, 5]

sorter.setStrategy(reverseStrategy);
console.log(sorter.sort([3, 1, 4, 1, 5]));  // [5, 4, 3, 1, 1]

// Functional strategy — even simpler:
function processPayment(amount, strategy) {
  return strategy(amount);
}

const stripe = (amount) => `Stripe: charged $${amount}`;
const paypal = (amount) => `PayPal: sent $${amount}`;

console.log(processPayment(99, stripe)); // 'Stripe: charged $99'
console.log(processPayment(99, paypal)); // 'PayPal: sent $99'

// ============================================
// 3. Command — encapsulate actions as objects
// ============================================
// Use cases: undo/redo, transaction logs, queuing operations, macros

class TextEditor {
  #content = '';
  #history = [];
  #redoStack = [];

  execute(command) {
    command.execute(this);
    this.#history.push(command);
    this.#redoStack = []; // new action clears redo
  }

  undo() {
    const command = this.#history.pop();
    if (!command) return;
    command.undo(this);
    this.#redoStack.push(command);
  }

  redo() {
    const command = this.#redoStack.pop();
    if (!command) return;
    command.execute(this);
    this.#history.push(command);
  }

  get content() { return this.#content; }
  set content(v) { this.#content = v; }
}

class TypeCommand {
  #text;
  constructor(text) { this.#text = text; }
  execute(editor) { editor.content += this.#text; }
  undo(editor) { editor.content = editor.content.slice(0, -this.#text.length); }
}

class DeleteCommand {
  #n;
  #deleted = '';
  constructor(n) { this.#n = n; }
  execute(editor) {
    this.#deleted = editor.content.slice(-this.#n);
    editor.content = editor.content.slice(0, -this.#n);
  }
  undo(editor) { editor.content += this.#deleted; }
}

console.log('\n=== Command ===');
const editor = new TextEditor();

editor.execute(new TypeCommand('Hello'));
editor.execute(new TypeCommand(', World'));
console.log(editor.content);  // 'Hello, World'

editor.execute(new DeleteCommand(6));
console.log(editor.content);  // 'Hello'

editor.undo();
console.log(editor.content);  // 'Hello, World'

editor.undo();
console.log(editor.content);  // 'Hello'

editor.redo();
console.log(editor.content);  // 'Hello, World'

// ============================================
// 4. JS-specific: Module Pattern & Pub/Sub
// ============================================
console.log('\n=== Module Pattern ===');

// Encapsulation via closure — private state, public API
const cartModule = (() => {
  const _items = [];

  return {
    add(item) { _items.push(item); },
    remove(name) {
      const idx = _items.findIndex(i => i.name === name);
      if (idx !== -1) _items.splice(idx, 1);
    },
    total() { return _items.reduce((sum, i) => sum + i.price, 0); },
    items() { return [..._items]; }, // copy — prevent external mutation
  };
})();

cartModule.add({ name: 'Apple', price: 1.5 });
cartModule.add({ name: 'Bread', price: 2.0 });
cartModule.remove('Apple');
console.log(cartModule.total()); // 2
console.log(cartModule.items()); // [{ name: 'Bread', price: 2 }]

// _items is NOT accessible from outside
// console.log(cartModule._items); // undefined — truly private

console.log('\n=== Pub/Sub ===');

// Pub/Sub: publisher and subscriber don't know about each other
const pubsub = {
  _channels: {},
  subscribe(channel, fn) {
    (this._channels[channel] ??= []).push(fn);
    return () => this.unsubscribe(channel, fn);
  },
  unsubscribe(channel, fn) {
    this._channels[channel] = (this._channels[channel] ?? []).filter(f => f !== fn);
  },
  publish(channel, data) {
    (this._channels[channel] ?? []).forEach(fn => fn(data));
  },
};

pubsub.subscribe('user:login', ({ username }) => {
  console.log(`Welcome, ${username}!`);
});

pubsub.subscribe('user:login', ({ username }) => {
  console.log(`Audit: ${username} logged in at ${new Date().toISOString()}`);
});

pubsub.publish('user:login', { username: 'Alice' });
