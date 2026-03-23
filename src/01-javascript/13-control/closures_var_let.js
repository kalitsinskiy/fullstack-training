// ============================================
// TASK 3: Closures, var vs let, factory state
// ============================================
// What does this code output? Explain why.

// --- Part 1 ---
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push({ val: i, fn: () => i }); // intentional: var closure trap
}

console.log(fns[0].val, fns[0].fn()); // ?
// On the first iteration val = 0 that's why we get 0
// fns[0].fn() return with 3 because it exists the only one copy of variable i
// for all loops (var trap)
console.log(fns[2].val, fns[2].fn()); // ?
// On the third iteration val = 2 that's why we get 2
// fns[2].fn() return with 3 because it exists the only one copy of variable i
// for all loops (var trap)

// --- Part 2 ---
function makePlugin(id, registry) {
  let uses = 0;
  registry.push(id);
  return {
    id,
    run() {
      uses++;
      return `${this.id}:${uses}`;
    },
    stats: () => ({ id, uses }),
  };
}

const reg = [];
const p1 = makePlugin('A', reg);
const p2 = makePlugin('B', reg);

console.log(p1.run()); // ? A:1 - Calls the function with closure for 1 time, 0 -> 1
console.log(p1.run()); // ? A:2 - Calls the function with closure for 2 time, 1 -> 2
console.log(p2.run()); // ? B:1 - Makes new intance of makePlugin, so it's another instance. 0 -> 1
console.log(reg); // ? ['A', 'B'] - The arrays are passed to the functions by their refference.
// That's why all instances of makePlugin is connected to the same reg array.

// --- Part 3 ---
const { run } = p1;
console.log(run()); // undefined: 3 or Error in "strict mode"
// After decomposition we run is not pointing to p1 and when we call it like run()
// the key word THIS is not pointing on instance of p1, it's pointing on window (global)
// That's why we got undefined.
// Still the closure is still working and uses increased the number 2 -> 3
console.log(p1.stats()); // { id: 'A', uses: 3 }
console.log(p2.stats()); // { id: 'B', uses: 1 }
// Function stats() is an arrow function which has no self THIS but from the outer scope
// That's why it shows 3 (2 in part1 + 1 in part3) for A
// and 1 for B

const allVals = fns.map((f) => f.fn()).concat(reg);
console.log(allVals); // [ 3, 3, 3, 'A', 'B' ]
// It show 3, 3, 3 at the beginning because var was used for iterator.
// So i was memorized on the last value of 3
// A, B - reg stores IDs which we added on plugins creation
// .concat only merged two arrays in one.
