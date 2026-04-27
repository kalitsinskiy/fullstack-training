// ============================================
// ALGORITHMS & DATA STRUCTURES — Exercises
// ============================================
// Complete each TODO. No built-in sort unless specified.

// ---
// Exercise 1: Two Sum
// Return indices of two numbers that add up to target
// Use O(n) time with a Map — NOT O(n²) nested loop
//
// twoSum([2, 7, 11, 15], 9)  → [0, 1]
// twoSum([3, 2, 4], 6)       → [1, 2]
// twoSum([3, 3], 6)           → [0, 1]

function twoSum(nums, target) {
  // TODO
}

console.log(twoSum([2, 7, 11, 15], 9));  // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]

// ---
// Exercise 2: Reverse a linked list
// Given a LinkedList class (simplified), reverse it in-place
// Input:  1 → 2 → 3 → 4 → null
// Output: 4 → 3 → 2 → 1 → null

class ListNode {
  constructor(value) { this.value = value; this.next = null; }
}

function arrayToList(arr) {
  let head = null, tail = null;
  for (const v of arr) {
    const node = new ListNode(v);
    if (!head) head = tail = node;
    else { tail.next = node; tail = node; }
  }
  return head;
}

function listToArray(head) {
  const result = [];
  while (head) { result.push(head.value); head = head.next; }
  return result;
}

function reverseList(head) {
  // TODO
}

const list = arrayToList([1, 2, 3, 4]);
console.log(listToArray(reverseList(list))); // [4, 3, 2, 1]

// ---
// Exercise 3: Valid parentheses (use Stack)
// Given a string with (, ), {, }, [, ]
// Return true if all brackets are properly closed and nested

function isBalanced(str) {
  // TODO
}

console.log(isBalanced('()[]{}'));     // true
console.log(isBalanced('({[]})'));     // true
console.log(isBalanced('({[})'));      // false
console.log(isBalanced('((())'));      // false

// ---
// Exercise 4: Find the most frequent element
// Return the element that appears most often
// If tie — return the one that appears first
// Use O(n) time

function mostFrequent(arr) {
  // TODO
}

console.log(mostFrequent([1, 3, 1, 3, 2, 1])); // 1
console.log(mostFrequent(['a', 'b', 'a', 'c'])); // 'a'

// ---
// Exercise 5: Binary search — find first occurrence
// In a sorted array with possible duplicates,
// return the index of the FIRST occurrence of target
// Return -1 if not found. Must be O(log n).

function firstOccurrence(arr, target) {
  // TODO
}

console.log(firstOccurrence([1, 2, 2, 2, 3], 2)); // 1
console.log(firstOccurrence([1, 2, 3, 4, 5], 3)); // 2
console.log(firstOccurrence([1, 2, 3], 9));        // -1

// ---
// Exercise 6: Insertion sort implementation
// Sort array using insertion sort — no built-in .sort()

function insertionSort(arr) {
  // TODO
}

console.log(insertionSort([5, 3, 8, 1, 2])); // [1, 2, 3, 5, 8]
console.log(insertionSort([1]));              // [1]
console.log(insertionSort([]));               // []

// ---
// Challenge: Flatten nested array (any depth) without .flat()
// [[1, [2]], [3, [4, [5]]]] → [1, 2, 3, 4, 5]

function flatDeep(arr) {
  // TODO — hint: recursion
}

console.log(flatDeep([[1, [2]], [3, [4, [5]]]])); // [1, 2, 3, 4, 5]

// ---
// Challenge: Level-order tree traversal (BFS)
// Given a binary tree, return array of arrays — one per level
//
//       3
//      / \
//     9   20
//        /  \
//       15   7
//
// → [[3], [9, 20], [15, 7]]

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

function levelOrder(root) {
  // TODO — use Queue (array with shift)
}

const tree = new TreeNode(3,
  new TreeNode(9),
  new TreeNode(20, new TreeNode(15), new TreeNode(7))
);
console.log(levelOrder(tree)); // [[3], [9, 20], [15, 7]]
