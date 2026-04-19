// ============================================
// DATA STRUCTURES in JavaScript
// ============================================

// ============================================
// 1. Stack — LIFO (Last In, First Out)
// ============================================
// Use cases: undo/redo, call stack, expression parsing, DFS

class Stack {
  #items = [];

  push(item)  { this.#items.push(item); }
  pop()       { return this.#items.pop(); }
  peek()      { return this.#items[this.#items.length - 1]; }
  isEmpty()   { return this.#items.length === 0; }
  get size()  { return this.#items.length; }
}

// Practical: check balanced brackets
function isBalanced(str) {
  const stack = new Stack();
  const pairs = { ')': '(', ']': '[', '}': '{' };

  for (const ch of str) {
    if ('([{'.includes(ch))  stack.push(ch);
    else if (')]}'.includes(ch)) {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.isEmpty();
}

console.log('=== Stack ===');
const s = new Stack();
s.push(1); s.push(2); s.push(3);
console.log(s.peek()); // 3
console.log(s.pop());  // 3
console.log(s.size);   // 2

console.log(isBalanced('({[]})'));  // true
console.log(isBalanced('({[})'));   // false
console.log(isBalanced('((())'));   // false

// ============================================
// 2. Queue — FIFO (First In, First Out)
// ============================================
// Use cases: task queue, BFS, print queue, event loop

class Queue {
  #items = [];

  enqueue(item) { this.#items.push(item); }
  dequeue()     { return this.#items.shift(); }
  front()       { return this.#items[0]; }
  isEmpty()     { return this.#items.length === 0; }
  get size()    { return this.#items.length; }
}

console.log('\n=== Queue ===');
const q = new Queue();
q.enqueue('task1'); q.enqueue('task2'); q.enqueue('task3');
console.log(q.front());    // 'task1'
console.log(q.dequeue());  // 'task1'
console.log(q.size);       // 2

// ============================================
// 3. Linked List — node chain with pointers
// ============================================
// O(1) insert/delete at head, O(n) access by index
// No wasted space, no shifting

class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  #head = null;
  #size = 0;

  prepend(value) {
    const node = new ListNode(value);
    node.next = this.#head;
    this.#head = node;
    this.#size++;
  }

  append(value) {
    const node = new ListNode(value);
    if (!this.#head) { this.#head = node; }
    else {
      let current = this.#head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.#size++;
  }

  delete(value) {
    if (!this.#head) return;
    if (this.#head.value === value) { this.#head = this.#head.next; this.#size--; return; }
    let current = this.#head;
    while (current.next && current.next.value !== value) current = current.next;
    if (current.next) { current.next = current.next.next; this.#size--; }
  }

  toArray() {
    const result = [];
    let current = this.#head;
    while (current) { result.push(current.value); current = current.next; }
    return result;
  }

  get size() { return this.#size; }
}

console.log('\n=== Linked List ===');
const ll = new LinkedList();
ll.append(1); ll.append(2); ll.append(3);
ll.prepend(0);
console.log(ll.toArray()); // [0, 1, 2, 3]
ll.delete(2);
console.log(ll.toArray()); // [0, 1, 3]
console.log(ll.size);      // 3

// ============================================
// 4. Hash Map — key → value, O(1) avg
// ============================================
// JS Map is a built-in hash map

console.log('\n=== Hash Map (JS Map) ===');

// Frequency counter — classic O(n) pattern
function charFrequency(str) {
  const freq = new Map();
  for (const ch of str) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  return freq;
}

const freq = charFrequency('mississippi');
console.log([...freq.entries()]); // [['m',1],['i',4],['s',4],['p',2]]

// Group by
function groupBy(arr, keyFn) {
  return arr.reduce((map, item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
    return map;
  }, new Map());
}

const words = ['apple', 'ant', 'banana', 'bear', 'cherry'];
const byLetter = groupBy(words, w => w[0]);
console.log([...byLetter.entries()]); // [['a',[...]], ['b',[...]], ['c',[...]]]

// ============================================
// 5. Binary Search Tree — sorted, O(log n) avg
// ============================================
// Left < node < Right. Degrades to O(n) if unbalanced.

class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  #root = null;

  insert(value) {
    this.#root = this.#insertNode(this.#root, value);
  }

  #insertNode(node, value) {
    if (!node) return new BSTNode(value);
    if (value < node.value) node.left = this.#insertNode(node.left, value);
    else if (value > node.value) node.right = this.#insertNode(node.right, value);
    return node;
  }

  contains(value) {
    let node = this.#root;
    while (node) {
      if (value === node.value) return true;
      node = value < node.value ? node.left : node.right;
    }
    return false;
  }

  // In-order traversal → sorted array
  inOrder() {
    const result = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      result.push(node.value);
      traverse(node.right);
    };
    traverse(this.#root);
    return result;
  }
}

console.log('\n=== Binary Search Tree ===');
const bst = new BST();
[5, 3, 7, 1, 4, 6, 8].forEach(n => bst.insert(n));
console.log(bst.inOrder());      // [1, 3, 4, 5, 6, 7, 8]
console.log(bst.contains(4));    // true
console.log(bst.contains(9));    // false
