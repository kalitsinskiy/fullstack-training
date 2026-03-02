export {};
// ============================================
// INTERFACES & TYPE ALIASES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: npx ts-node src/02-typescript/02-interfaces/exercises/interfaces.ts

console.log('=== Exercise 1: Design a Product interface ===');
// TODO: Create an interface 'Product' with:
//   - id: number (required)
//   - name: string (required)
//   - price: number (required)
//   - sku: string (readonly)
//   - description: string (optional)
//   - tags: string[] (optional)
// Then create a valid product object

// Your code here:

// console.log(product.name, product.price);


console.log('\n=== Exercise 2: Extend an interface ===');
// TODO: Create interface 'Animal' with name: string and speak(): string
// Then create interface 'Pet' that extends Animal and adds:
//   - owner: string
//   - vaccinated: boolean
// Create a 'cat' object that satisfies the Pet interface

// Your code here:

// console.log(cat.name, cat.speak(), cat.owner);


console.log('\n=== Exercise 3: type for union + literals ===');
// TODO: Create a type 'HttpMethod' with values: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
// Then create an interface 'ApiRequest' with:
//   - url: string
//   - method: HttpMethod
//   - body?: unknown
//   - headers?: Record<string, string>
// Create a sample request object

// Your code here:

// console.log(request.method, request.url);


console.log('\n=== Exercise 4: Declaration merging ===');
// TODO: Create an interface 'AppConfig' with:
//   - theme: 'light' | 'dark'
//   - language: string
// In a separate declaration (same interface name), add:
//   - version: string
//   - debug: boolean
// Create a config object that satisfies both

// Your code here:

// console.log(appConfig.theme, appConfig.version);


console.log('\n=== Exercise 5: type vs interface choice ===');
// TODO: For each of the following, decide whether to use 'type' or 'interface' and implement it:
// a) A shape that can be 'circle', 'square', or 'triangle' with appropriate properties
// b) A 'Repository<T>' shape with methods: findById, findAll, save, delete
// c) A tuple representing a database row: [id: number, name: string, createdAt: Date]
// d) An intersection of 'Auditable' ({ createdBy: string }) and 'Deletable' ({ deletedAt?: Date })

// Your code here:


console.log('\n=== Exercise 6: Index signature ===');
// TODO: Create an interface 'TranslationMap' where:
//   - keys are strings (translation keys like 'welcome', 'logout')
//   - values are strings (translated text)
// Create a translations object for English ('en')
// Then write a function 'translate' that takes key and map and returns the value
// or '[key]' if not found

// Your code here:

// const en: TranslationMap = { welcome: 'Welcome!', logout: 'Log out' };
// console.log(translate('welcome', en)); // 'Welcome!'
// console.log(translate('unknown', en)); // '[unknown]'


console.log('\n=== Exercise 7: Implementing an interface ===');
// TODO: Create an interface 'Stack<T>' with:
//   - push(item: T): void
//   - pop(): T | undefined
//   - peek(): T | undefined
//   - readonly size: number
//   - isEmpty(): boolean
// Then implement this interface in a class 'ArrayStack<T>'

// Your code here:

// const stack = new ArrayStack<number>();
// stack.push(1);
// stack.push(2);
// stack.push(3);
// console.log(stack.peek());  // 3
// console.log(stack.pop());   // 3
// console.log(stack.size);    // 2


console.log('\n=== 🎯 Challenge: API client types ===');
// TODO: Design type definitions for a simple REST API client:
//
// 1. type 'HttpStatus' — union of common status codes (200, 201, 400, 401, 403, 404, 500)
// 2. type 'ApiResponse<T>' — discriminated union:
//      - success: { ok: true; status: HttpStatus; data: T }
//      - failure: { ok: false; status: HttpStatus; error: string }
// 3. interface 'ApiClient' with methods:
//      - get<T>(url: string): Promise<ApiResponse<T>>
//      - post<T>(url: string, body: unknown): Promise<ApiResponse<T>>
// 4. type 'User' with id, name, email
// 5. Simulate calling client.get<User>('/users/1') and handling both cases

// Your code here:

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
