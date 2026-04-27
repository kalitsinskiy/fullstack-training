# Algorithms & Data Structures

## Big O Notation

Big O describes how execution time/memory grows relative to input size.

| Notation   | Name        | Example                        |
|------------|-------------|--------------------------------|
| O(1)       | Constant    | Array index access             |
| O(log n)   | Logarithmic | Binary search                  |
| O(n)       | Linear      | Linear search, single loop     |
| O(n log n) | Linearithmic| Merge sort, quick sort (avg)   |
| O(n²)      | Quadratic   | Bubble sort, nested loops      |
| O(2ⁿ)      | Exponential | Recursive Fibonacci (naive)    |

**Rules:**
- Drop constants: O(2n) → O(n)
- Drop lower terms: O(n² + n) → O(n²)
- Worst-case is what matters (usually)

## Sorting Algorithms

| Algorithm      | Best     | Average  | Worst    | Space  | Stable |
|----------------|----------|----------|----------|--------|--------|
| Bubble Sort    | O(n)     | O(n²)    | O(n²)    | O(1)   | ✅     |
| Selection Sort | O(n²)    | O(n²)    | O(n²)    | O(1)   | ❌     |
| Insertion Sort | O(n)     | O(n²)    | O(n²)    | O(1)   | ✅     |
| Merge Sort     | O(n log n)| O(n log n)| O(n log n)| O(n) | ✅     |
| Quick Sort     | O(n log n)| O(n log n)| O(n²)   | O(log n)| ❌    |

## Data Structures

| Structure   | Access | Search | Insert | Delete | Notes                    |
|-------------|--------|--------|--------|--------|--------------------------|
| Array       | O(1)   | O(n)   | O(n)   | O(n)   | Fast index access        |
| Stack       | O(n)   | O(n)   | O(1)   | O(1)   | LIFO — push/pop end      |
| Queue       | O(n)   | O(n)   | O(1)   | O(1)   | FIFO — push end/pop front|
| Linked List | O(n)   | O(n)   | O(1)   | O(1)   | No index, pointer-based  |
| Hash Map    | O(1)   | O(1)   | O(1)   | O(1)   | avg — key → value        |
| Binary Tree | O(log n)| O(log n)| O(log n)| O(log n)| sorted BST            |

## Searching

- **Linear search** — O(n), works on any array
- **Binary search** — O(log n), requires SORTED array

## Learn More

- [javascript.info: Recursion](https://javascript.info/recursion)
- [MDN: Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/)
- [Visualgo — algorithm visualizations](https://visualgo.net/)
