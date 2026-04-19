// ============================================
// SORTING ALGORITHMS in JavaScript
// ============================================

// ============================================
// 1. Bubble Sort — O(n²) / O(n) best
// ============================================
// Compare adjacent pairs, bubble largest to end
// Simple but slow — good for learning, not production

function bubbleSort(arr) {
  const a = [...arr]; // don't mutate original
  let swapped;
  for (let i = 0; i < a.length; i++) {
    swapped = false;
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]]; // swap
        swapped = true;
      }
    }
    if (!swapped) break; // already sorted → O(n) best case
  }
  return a;
}

// ============================================
// 2. Selection Sort — O(n²) always
// ============================================
// Find minimum in unsorted part, swap to front
// Never more than n swaps — useful when writes are expensive

function selectionSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) [a[i], a[minIdx]] = [a[minIdx], a[i]];
  }
  return a;
}

// ============================================
// 3. Insertion Sort — O(n²) / O(n) best
// ============================================
// Build sorted portion left to right
// Excellent for small arrays or nearly-sorted data
// Used internally by many sort() implementations for small subarrays

function insertionSort(arr) {
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const current = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > current) {
      a[j + 1] = a[j]; // shift right
      j--;
    }
    a[j + 1] = current; // insert
  }
  return a;
}

// ============================================
// 4. Merge Sort — O(n log n) always, O(n) space
// ============================================
// Divide in half, sort each half, merge
// Stable, predictable — great for linked lists and external sorting

function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  // append remaining
  return result.concat(left.slice(i)).concat(right.slice(j));
}

// ============================================
// 5. Quick Sort — O(n log n) avg, O(n²) worst
// ============================================
// Pick pivot, partition: smaller left, larger right, recurse
// Fast in practice (cache-friendly), O(log n) space

function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)]; // middle element as pivot
  const left   = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right  = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// ============================================
// Demo & Comparison
// ============================================
const unsorted = [64, 34, 25, 12, 22, 11, 90];

console.log('Original:       ', unsorted);
console.log('Bubble Sort:    ', bubbleSort(unsorted));
console.log('Selection Sort: ', selectionSort(unsorted));
console.log('Insertion Sort: ', insertionSort(unsorted));
console.log('Merge Sort:     ', mergeSort(unsorted));
console.log('Quick Sort:     ', quickSort(unsorted));

// Performance test
console.log('\n=== Performance (10 000 random elements) ===');
const large = Array.from({ length: 10000 }, () => Math.random() * 10000 | 0);

console.time('Merge Sort');
mergeSort(large);
console.timeEnd('Merge Sort');

console.time('Quick Sort');
quickSort(large);
console.timeEnd('Quick Sort');

console.time('Native .sort()');
[...large].sort((a, b) => a - b);
console.timeEnd('Native .sort()');

// Native .sort() wins — implemented in C++ with Tim Sort (merge + insertion hybrid)

console.log('\n=== Edge cases ===');
console.log(mergeSort([]));         // []
console.log(mergeSort([1]));        // [1]
console.log(mergeSort([2, 1]));     // [1, 2]
console.log(mergeSort([1, 1, 1]));  // [1, 1, 1]
