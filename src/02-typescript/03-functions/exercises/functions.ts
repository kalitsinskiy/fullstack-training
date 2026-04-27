export {};
// ============================================
// FUNCTIONS Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: npx ts-node src/02-typescript/03-functions/exercises/functions.ts

console.log('=== Exercise 1: Add return types ===');
// TODO: Add explicit return type annotations to each function below

function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

function isAdult(age: number): boolean {
  return age >= 18;
}

function getRandomElement(arr: string[]): string | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

console.log(getFullName('Alice', 'Smith'));
console.log(getRandomElement(['red', 'green', 'blue']));
console.log(isAdult(20), isAdult(15));

console.log('\n=== Exercise 2: Optional and default parameters ===');
// TODO: Write a function 'formatCurrency' with:
//   - amount: number (required)
//   - currency: string (default: 'USD')
//   - decimals: number (default: 2)
//   - symbol?: string (optional, prepended if provided)
// Returns a string like '$1,234.56' or '1234.56 USD'

// Your function here:
function formatCurrency(amount: number, currency: string = 'USD', decimals: number = 2, symbol?: string): string {
  const num = amount.toFixed(decimals);
  if (symbol) {
    return `${symbol}${num}`;
  }
  return `${amount.toFixed(decimals)} ${currency}`;
}

console.log(formatCurrency(1234.5));           // '1,234.50 USD'
console.log(formatCurrency(1234.5, 'EUR', 2)); // '1,234.50 EUR'
console.log(formatCurrency(9.99, 'USD', 2, '$')); // '$9.99'

console.log('\n=== Exercise 3: Rest parameters ===');
// TODO: Write a function 'mergeObjects' that accepts any number of objects
// and returns a single merged object (later properties override earlier ones)
// The function should work with any object type using generics (<T extends object>)

// Your function here:
function mergeObjects<T extends object>(...objects: T[]): T {
  return objects.reduce((previous: T, current: T) => {
    return {...previous, ...current};
  }, {} as T);
}

const merged = mergeObjects({ a: 1 }, { b: 2 }, { a: 10, c: 3 });
console.log(merged); // { a: 10, b: 2, c: 3 }

console.log('\n=== Exercise 4: Function type alias ===');
// TODO: Create a type alias 'Validator<T>' for a function that:
//   - accepts a value of type T
//   - returns { valid: true } | { valid: false; message: string }
// Then implement two validators:
//   - 'isNonEmpty': Validator<string> — checks string is not empty
//   - 'isPositive': Validator<number> — checks number > 0

// Your code here:
type Validator<T> = (value: T) => { valid: true } | { valid: false; message: string };

const isNonEmpty: Validator<string> = (value: string) => {
  if (value.trim().length > 0) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Value is empty'
  };
};
const isPositive: Validator<number> = (value: number) => {
  return value >= 0
    ? { valid: true }
    : { valid: false, message: 'Value is negative'};
};

console.log(isNonEmpty(''));       // { valid: false, message: '...' }
console.log(isNonEmpty('hello'));  // { valid: true }
console.log(isPositive(-1));       // { valid: false, message: '...' }
console.log(isPositive(5));        // { valid: true }

console.log('\n=== Exercise 5: Overloads ===');
// TODO: Write an overloaded function 'repeat':
//   - repeat(str: string, times: number): string  — repeats the string
//   - repeat(arr: number[], times: number): number[]  — repeats array elements
// Example: repeat('ab', 3) => 'ababab'
//          repeat([1, 2], 3) => [1, 2, 1, 2, 1, 2]

// Your overloads and implementation here:
function repeat(str: string, times: number): string;
function repeat(arr: number[], times: number): number[];
function repeat(input: string | number[], times: number): string | number[] {
  if (typeof input === 'string') {
    return input.repeat(times);
  }

  const arr: number[] = [];
  for (let i = 0; i < times; i++) {
    arr.push(...input);
  }
  return arr;
}

console.log(repeat('ab', 3));      // 'ababab'
console.log(repeat([1, 2], 3));    // [1, 2, 1, 2, 1, 2]

console.log('\n=== Exercise 6: Higher-order functions ===');
// TODO: Write a function 'memoize' that:
//   - takes a function f: (x: number) => number
//   - returns a new function with the same signature
//   - the returned function caches results by input value
//   - if called again with the same input, returns cached result

// Your function here:
type Func = (x: number) => number;
function memoize(fn: Func): Func {
  const cache = new Map<number, number>();
  return (x: number): number => {
    if (cache.has(x)) {
      return cache.get(x) ?? -1000000;
    }
    const result = fn(x);
    cache.set(x, result);
    return result;
  };
}

let callCount = 0;
const expensive = memoize((n: number) => {
  callCount++;
  return n * n;
});
console.log(expensive(5)); // 25
console.log(expensive(5)); // 25 (cached)
console.log(expensive(3)); // 9
console.log('Calls made:', callCount); // 2 (not 3!)

console.log('\n=== Exercise 7: never for exhaustive checks ===');
// TODO: Create a type 'Shape':
//   - { kind: 'circle'; radius: number }
//   - { kind: 'rectangle'; width: number; height: number }
//   - { kind: 'triangle'; base: number; height: number }
// Write 'area(shape: Shape): number' that handles all cases
// Include a default that calls assertNever so TypeScript will catch missing cases

function assertNever(_value: never): never {
  throw new Error(`Unhandled shape: ${JSON.stringify(_value)}`);
}

// Your code here:
type Shape =
 { kind: 'circle'; radius: number } |
 { kind: 'rectangle'; width: number; height: number } |
 { kind: 'triangle'; base: number; height: number };

 function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return circleArea(shape.radius);
    case 'rectangle':
      return rectangleArea(shape.width, shape.height);
    case 'triangle':
      return triangleArea(shape.base, shape.height);
    default:
      return invalidShape();
  }
 }

function circleArea(radius: number): number {
  return Math.PI * radius^2;
}

function rectangleArea(width: number, height: number): number {
  return width * height;
}

function triangleArea(base: number, height: number): number {
  return base * height / 2;
}

function invalidShape(): never {
  throw new Error('Invalid shape');
}

console.log(area({ kind: 'circle', radius: 5 }));
console.log(area({ kind: 'rectangle', width: 4, height: 6 }));
console.log(area({ kind: 'triangle', base: 3, height: 4 }));

console.log('\n=== 🎯 Challenge: Pipeline ===');
// TODO: Build a simple data pipeline using function types:
//
// type Step<T, U> = (input: T) => U;
//
// Write a function 'pipe' that accepts:
//   pipe(value: A, step1: Step<A,B>, step2: Step<B,C>, step3: Step<C,D>): D
// (you may limit to 3 steps for now, or try to make it variadic)
//
// Then create a pipeline:
//   1. Parse: string → number[]  (split by comma, map to Number)
//   2. Filter: number[] → number[]  (keep only positive)
//   3. Reduce: number[] → number  (sum)
//
// pipe('1,-2,3,-4,5', parse, filterPositive, sumAll) === 9

// Your code here:
type Step<T,U> = (input: T) => U;

function pipe<A,B,C,D>(value: A, step1: Step<A,B>, step2: Step<B, C>, step3: Step<C, D>): D {
  return step3(step2(step1(value)));
}

const parse: Step<string, number[]> = (input: string): number[] => {
  return input.split(',').map((strNum) => Number(strNum.trim()));
};
const filterPositive: Step<number[], number[]> = (input: number[]): number[] => {
  return input.filter((num) => num >= 0);
};
const sumAll: Step<number[], number> = (input: number[]): number => {
  return input.reduce((sum, current) => sum+current, 0);
};

const pipeResult = pipe('1,-2,3,-4,5', parse, filterPositive, sumAll);
console.log(pipeResult);

console.log('\n✅ Exercises completed! Check your answers with a mentor.');

// Pre-provided helper — exported so TypeScript knows it's used in exercise 7
export { assertNever };
