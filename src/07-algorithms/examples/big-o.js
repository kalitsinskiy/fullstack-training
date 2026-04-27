// ============================================
// BIG O NOTATION — practical examples
// ============================================

// O(1) — Constant time
// Input size doesn't matter
function getFirst(arr) {
  return arr[0]; // always 1 operation
}

function isEven(n) {
  return n % 2 === 0; // always 1 operation
}

// O(log n) — Logarithmic
// Input halves each step → binary search, tree traversal
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
// 1000 elements → ~10 steps (log₂ 1000 ≈ 10)
// 1 000 000 elements → ~20 steps

// O(n) — Linear
// One loop through input
function linearSearch(arr, target) {
  for (const item of arr) {     // n iterations
    if (item === target) return true;
  }
  return false;
}

function sumAll(arr) {
  return arr.reduce((acc, n) => acc + n, 0); // n iterations
}

// O(n log n) — Linearithmic
// Typical for efficient sorting (merge sort, quick sort)
// n elements, each processed log n times
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  return merge(mergeSort(arr.slice(0, mid)), mergeSort(arr.slice(mid)));
}
function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}

// O(n²) — Quadratic
// Nested loop — every element paired with every other
function bubbleSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {         // n
    for (let j = 0; j < a.length - i - 1; j++) { // n
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  }
  return a;
}

function hasDuplicate_slow(arr) { // O(n²)
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// ✅ Same task in O(n) using Set:
function hasDuplicate_fast(arr) { // O(n)
  return new Set(arr).size !== arr.length;
}

// O(2ⁿ) — Exponential
// Naive recursion with branching — grows extremely fast
function fibNaive(n) { // O(2ⁿ)
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2); // two recursive calls each time
}

// ✅ Memoized → O(n):
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

// --- Demo ---
console.log('=== Big O Demo ===');

const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log('Binary search 7:', binarySearch(sorted, 7));   // 3
console.log('Binary search 6:', binarySearch(sorted, 6));   // -1

console.log('Merge sort:', mergeSort([5, 3, 8, 1, 2]));     // [1,2,3,5,8]
console.log('Bubble sort:', bubbleSort([5, 3, 8, 1, 2]));   // [1,2,3,5,8]

console.log('Has duplicate slow:', hasDuplicate_slow([1, 2, 3, 1])); // true
console.log('Has duplicate fast:', hasDuplicate_fast([1, 2, 3, 1])); // true

console.log('Fib(10) naive:', fibNaive(10));  // 55
console.log('Fib(40) memo:', fibMemo(40));    // 102334155 (fibNaive(40) would be slow!)

// --- Measuring ---
console.log('\n=== Time comparison ===');
const large = Array.from({ length: 10000 }, (_, i) => i);

console.time('O(n) hasDuplicate_fast');
hasDuplicate_fast(large);
console.timeEnd('O(n) hasDuplicate_fast');

console.time('O(n²) hasDuplicate_slow');
hasDuplicate_slow(large);
console.timeEnd('O(n²) hasDuplicate_slow');
