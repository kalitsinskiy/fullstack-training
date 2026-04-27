// ============================================
// SEARCHING ALGORITHMS
// ============================================

// ============================================
// 1. Linear Search — O(n)
// ============================================
// Works on any array (sorted or not)
// Check every element until found

function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i; // return index
  }
  return -1; // not found
}

// Generic version: find by predicate
function linearFind(arr, predicate) {
  for (const item of arr) {
    if (predicate(item)) return item;
  }
  return null;
}

console.log('=== Linear Search ===');
console.log(linearSearch([5, 3, 8, 1, 9], 8));  // 2
console.log(linearSearch([5, 3, 8, 1, 9], 7));  // -1

const users = [{ id: 1 }, { id: 2 }, { id: 3 }];
console.log(linearFind(users, u => u.id === 2)); // { id: 2 }

// ============================================
// 2. Binary Search — O(log n)
// ============================================
// REQUIRES sorted array
// Each step eliminates half the search space
// 1 000 000 elements → max ~20 comparisons

function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;        // found!
    if (arr[mid] < target)   left = mid + 1;   // search right half
    else                     right = mid - 1;  // search left half
  }

  return -1; // not found
}

// Recursive version
function binarySearchRecursive(arr, target, left = 0, right = arr.length - 1) {
  if (left > right) return -1;

  const mid = Math.floor((left + right) / 2);

  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return binarySearchRecursive(arr, target, mid + 1, right);
  return binarySearchRecursive(arr, target, left, mid - 1);
}

// Find leftmost position (for duplicates)
function binarySearchLeft(arr, target) {
  let left = 0, right = arr.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] < target) left = mid + 1;
    else right = mid;
  }
  return arr[left] === target ? left : -1;
}

console.log('\n=== Binary Search ===');
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log(binarySearch(sorted, 7));   // 3
console.log(binarySearch(sorted, 6));   // -1
console.log(binarySearch(sorted, 1));   // 0
console.log(binarySearch(sorted, 19));  // 9

console.log(binarySearchRecursive(sorted, 11)); // 5

const withDups = [1, 2, 2, 2, 3, 4];
console.log(binarySearchLeft(withDups, 2));     // 1 (leftmost)

// ============================================
// 3. Depth-First Search (DFS) — graph/tree
// ============================================
// Go deep before going wide
// Uses stack (or recursion)
// Good for: path finding, cycle detection, topological sort

const graph = {
  A: ['B', 'C'],
  B: ['D', 'E'],
  C: ['F'],
  D: [],
  E: ['F'],
  F: [],
};

function dfs(graph, start) {
  const visited = new Set();
  const result = [];

  function explore(node) {
    if (visited.has(node)) return;
    visited.add(node);
    result.push(node);
    for (const neighbor of graph[node]) {
      explore(neighbor);
    }
  }

  explore(start);
  return result;
}

// Iterative DFS with stack
function dfsIterative(graph, start) {
  const visited = new Set();
  const stack = [start];
  const result = [];

  while (stack.length) {
    const node = stack.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    result.push(node);
    stack.push(...graph[node]); // add neighbors
  }

  return result;
}

// ============================================
// 4. Breadth-First Search (BFS) — graph/tree
// ============================================
// Visit all neighbors before going deeper
// Uses queue
// Good for: shortest path (unweighted), level-order traversal

function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length) {
    const node = queue.shift(); // dequeue
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor); // enqueue
      }
    }
  }

  return result;
}

// BFS to find shortest path
function shortestPath(graph, start, end) {
  if (start === end) return [start];

  const visited = new Set([start]);
  const queue = [[start, [start]]]; // [node, path so far]

  while (queue.length) {
    const [node, path] = queue.shift();

    for (const neighbor of graph[node]) {
      if (neighbor === end) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null; // no path
}

console.log('\n=== DFS ===');
console.log(dfs(graph, 'A'));          // ['A', 'B', 'D', 'E', 'F', 'C']
console.log(dfsIterative(graph, 'A')); // order may differ

console.log('\n=== BFS ===');
console.log(bfs(graph, 'A'));                      // ['A', 'B', 'C', 'D', 'E', 'F']
console.log(shortestPath(graph, 'A', 'F'));        // ['A', 'C', 'F']
console.log(shortestPath(graph, 'A', 'D'));        // ['A', 'B', 'D']

// ============================================
// When to use DFS vs BFS?
// ============================================
// DFS:
//   - Finding if a path exists
//   - Maze solving, cycle detection
//   - Topological sorting
//   - Memory efficient for deep trees (only current path in stack)
//
// BFS:
//   - Shortest path (unweighted graph)
//   - Level-order processing
//   - Finding nearest neighbor
//   - Memory efficient for wide, shallow graphs
