export {};
// ============================================
// GENERICS Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: npx ts-node src/02-typescript/05-generics/exercises/generics.ts

console.log('=== Exercise 1: Generic function ===');
// TODO: Write a generic function 'compact<T>' that takes T[] | null | undefined
// and returns T[] — filters out null and undefined values from the array
// Hint: use .filter(item => item != null)

// Your function here:

// console.log(compact([1, null, 2, undefined, 3]));   // [1, 2, 3]
// console.log(compact(['a', null, 'b']));              // ['a', 'b']
// console.log(compact(null));                          // []


console.log('\n=== Exercise 2: Generic with constraint ===');
// TODO: Write a generic function 'sortBy<T>' that:
//   - takes an array of T and a key (K extends keyof T)
//   - returns a new sorted array by that key (ascending)
//   - the value at T[K] must be string | number (add this constraint)

// Your function here:

// const users = [
//   { name: 'Charlie', age: 25 },
//   { name: 'Alice', age: 30 },
//   { name: 'Bob', age: 20 },
// ];
// console.log(sortBy(users, 'name')); // Alice, Bob, Charlie
// console.log(sortBy(users, 'age'));  // 20, 25, 30


console.log('\n=== Exercise 3: Generic interface ===');
// TODO: Create a generic interface 'Result<T, E = Error>':
//   - success case: { success: true; value: T }
//   - failure case: { success: false; error: E }
// Write two helper functions:
//   - ok<T>(value: T): Result<T>
//   - fail<E = Error>(error: E): Result<never, E>
// Write a function 'mapResult<T, U, E>(result: Result<T, E>, fn: (v: T) => U): Result<U, E>'

// Your code here:

// const r1 = ok(42);
// const r2 = fail(new Error('oops'));
// const r3 = mapResult(r1, n => n * 2);
// console.log(r1, r2);
// console.log(r3); // { success: true, value: 84 }


console.log('\n=== Exercise 4: keyof usage ===');
// TODO: Write a function 'pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>'
// that creates a new object containing only the specified keys
// (Implement it yourself, don't rely on the Pick utility type doing the work)

// Your function here:

// const user = { id: 1, name: 'Alice', email: 'a@x.com', age: 30 };
// console.log(pick(user, ['name', 'email']));  // { name: 'Alice', email: 'a@x.com' }
// console.log(pick(user, ['id', 'age']));      // { id: 1, age: 30 }


console.log('\n=== Exercise 5: infer — extract types ===');
// TODO: Implement the following type utilities using 'infer':

// a) FirstArgument<T> — extracts the type of the first parameter
//    FirstArgument<(a: string, b: number) => void>  // string

// b) UnwrapArray<T> — extracts the element type from an array, or returns T if not array
//    UnwrapArray<string[]>   // string
//    UnwrapArray<number>     // number

// c) FlattenPromise<T> — like Awaited — unwraps one level of Promise
//    FlattenPromise<Promise<string>>  // string
//    FlattenPromise<string>           // string

// Your type definitions here:

// Verify (these should compile without errors):
// const fa: FirstArgument<(name: string, age: number) => void> = 'hello';
// const ua: UnwrapArray<number[]> = 42;
// const fp: FlattenPromise<Promise<boolean>> = true;
// console.log(fa, ua, fp);


console.log('\n=== Exercise 6: Generic class ===');
// TODO: Create a generic class 'Cache<K, V>' with:
//   - private storage: Map<K, V>
//   - set(key: K, value: V, ttlMs?: number): void
//     (if ttlMs is provided, the entry should auto-expire using setTimeout)
//   - get(key: K): V | undefined
//   - has(key: K): boolean
//   - delete(key: K): void
//   - clear(): void
//   - get size(): number

// Your code here:

// const cache = new Cache<string, number>();
// cache.set('a', 1);
// cache.set('b', 2);
// console.log(cache.get('a'));  // 1
// console.log(cache.size);     // 2
// cache.delete('a');
// console.log(cache.has('a')); // false


console.log('\n=== 🎯 Challenge: Type-safe deep get ===');
// TODO: Implement a type-safe 'deepGet' function:
// deepGet(obj, 'a.b.c') should return the value at obj.a.b.c
// TypeScript should infer the correct return type
//
// Hint: You'll need recursive conditional types and template literals
//
// type DeepGet<T, Path extends string> = ...
// function deepGet<T, Path extends string>(obj: T, path: Path): DeepGet<T, Path>
//
// const data = { user: { name: 'Alice', address: { city: 'Kyiv' } } };
// const city = deepGet(data, 'user.address.city');  // type: string

// Your code here:

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
