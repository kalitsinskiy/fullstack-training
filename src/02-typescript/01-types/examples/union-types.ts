export {};
// ============================================
// UNION TYPES, LITERAL TYPES, NARROWING Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/01-types/examples/union-types.ts

console.log('=== 1. Union types ===');

// A value that can be one of several types
let id: string | number = 1;
console.log('id as number:', id);

id = 'user_42';
console.log('id as string:', id);

function formatId(id: string | number): string {
  return `ID: ${id}`;
}
console.log(formatId(1));
console.log(formatId('abc'));


console.log('\n=== 2. Literal types ===');

// Only specific values are allowed
type Direction = 'up' | 'down' | 'left' | 'right';
type StatusCode = 200 | 400 | 404 | 500;
type Toggle = 'on' | 'off';
const lightSwitch: Toggle = 'on';
console.log('Toggle switch:', lightSwitch);

let dir: Direction = 'up';
dir = 'left';
// dir = 'diagonal'; // ❌ Type '"diagonal"' is not assignable to type 'Direction'

const code: StatusCode = 200;
console.log('Direction:', dir, 'Code:', code);

// Literal type + union combo
type ApiResult =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };

function handleResult(result: ApiResult): string {
  if (result.status === 'success') {
    return `OK: ${result.data}`;
  }
  return `Error: ${result.message}`;
}
console.log(handleResult({ status: 'success', data: 'User loaded' }));
console.log(handleResult({ status: 'error', message: 'Not found' }));


console.log('\n=== 3. Type narrowing ===');

// typeof guard
function processValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TypeScript knows: string
  }
  return value.toFixed(2); // TypeScript knows: number
}
console.log(processValue('hello'));
console.log(processValue(3.14159));

// instanceof guard
function formatDate(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date; // string
}
console.log(formatDate(new Date('2024-01-01')));
console.log(formatDate('2024-01-01'));

// in operator guard (check if property exists)
type Cat = { meow: () => void };
type Dog = { bark: () => void };

function makeSound(animal: Cat | Dog): void {
  if ('meow' in animal) {
    animal.meow(); // Cat
  } else {
    animal.bark(); // Dog
  }
}
makeSound({ meow: () => console.log('Meow!') });
makeSound({ bark: () => console.log('Woof!') });

// Discriminated union — most common pattern
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
  }
}

console.log('Circle area:', area({ kind: 'circle', radius: 5 }).toFixed(2));
console.log('Rect area:', area({ kind: 'rectangle', width: 4, height: 6 }));


console.log('\n=== 4. Intersection types ===');

// Combines multiple types into one (A AND B)
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

const person: Person = { name: 'Alice', age: 30 };
console.log('Person:', person);

// Useful for mixins / extending objects
type Admin = Person & { role: 'admin'; permissions: string[] };
const admin: Admin = {
  name: 'Bob',
  age: 25,
  role: 'admin',
  permissions: ['read', 'write'],
};
console.log('Admin:', admin);


console.log('\n=== 5. Optional chaining with types ===');

type User = {
  name: string;
  address?: {
    city: string;
    zip?: string;
  };
};

const userA: User = { name: 'Alice', address: { city: 'Kyiv' } };
const userB: User = { name: 'Bob' };

// Optional chaining works with union undefined
console.log(userA.address?.city);  // 'Kyiv'
console.log(userB.address?.city);  // undefined
console.log(userA.address?.zip ?? 'No zip'); // 'No zip' (nullish coalescing)

console.log('\n✅ Union types examples complete!');
