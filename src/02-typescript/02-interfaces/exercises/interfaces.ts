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
interface Product {
  id: number;
  name: string;
  price: number;
  readonly sku: string;
  description?: string;
  tags?: string[];
}

const product: Product = {
  id: 1,
  name: 'Laptop',
  price: 1500,
  sku: 'SKU-001',
};

console.log(product.name, product.price);

console.log('\n=== Exercise 2: Extend an interface ===');
// TODO: Create interface 'Animal' with name: string and speak(): string
// Then create interface 'Pet' that extends Animal and adds:
//   - owner: string
//   - vaccinated: boolean
// Create a 'cat' object that satisfies the Pet interface

// Your code here:
interface Animal {
  name: string;
  speak(): string;
}

interface Pet extends Animal {
  owner: string;
  vaccinates: boolean;
}

const cat: Pet = {
  name: 'Fluffy',
  speak() {
    return 'Meow';
  },
  owner: 'Bob',
  vaccinates: true,
};

console.log(cat.name, cat.speak(), cat.owner);

console.log('\n=== Exercise 3: type for union + literals ===');
// TODO: Create a type 'HttpMethod' with values: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
// Then create an interface 'ApiRequest' with:
//   - url: string
//   - method: HttpMethod
//   - body?: unknown
//   - headers?: Record<string, string>
// Create a sample request object

// Your code here:
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiRequest {
  url: string;
  method: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

const request: ApiRequest = {
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log(request.method, request.url);

console.log('\n=== Exercise 4: Declaration merging ===');
// TODO: Create an interface 'AppConfig' with:
//   - theme: 'light' | 'dark'
//   - language: string
// In a separate declaration (same interface name), add:
//   - version: string
//   - debug: boolean
// Create a config object that satisfies both

// Your code here:
interface AppConfig {
  theme: 'light' | 'dark';
  language: string;
}

interface AppConfig {
  version: string;
  debug: boolean;
}

const appConfig: AppConfig = {
  theme: 'dark',
  language: 'en-US',
  version: '1.98.1',
  debug: false,
};

console.log(appConfig.theme, appConfig.version);

console.log('\n=== Exercise 5: type vs interface choice ===');
// TODO: For each of the following, decide whether to use 'type' or 'interface' and implement it:
// a) A shape that can be 'circle', 'square', or 'triangle' with appropriate properties
// b) A 'Repository<T>' shape with methods: findById, findAll, save, delete
// c) A tuple representing a database row: [id: number, name: string, createdAt: Date]
// d) An intersection of 'Auditable' ({ createdBy: string }) and 'Deletable' ({ deletedAt?: Date })

// Your code here:
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; sideWidth: number }
  | { kind: 'triangle'; base: number; height: number };

interface Repository<T> {
  findById(id: number | string): T | null;
  findALL(): T[];
  save(): void;
  delete(id: number | string): boolean;
}

type dbRow = [id: number, name: string, createdAt: Date];

type Auditable = { createdBy: string };
type Deletable = { deletedAt?: Date };

type AuditableRecord = Auditable & Deletable;

console.log('\n=== Exercise 6: Index signature ===');
// TODO: Create an interface 'TranslationMap' where:
//   - keys are strings (translation keys like 'welcome', 'logout')
//   - values are strings (translated text)
// Create a translations object for English ('en')
// Then write a function 'translate' that takes key and map and returns the value
// or '[key]' if not found

// Your code here:
interface TranslationMap {
  [key: string]: string;
}

function translate(word: string, map: TranslationMap): string {
  return map[word] ?? `[${word}]`;
}

const en: TranslationMap = { welcome: 'Welcome!', logout: 'Log out' };
console.log(translate('welcome', en)); // 'Welcome!'
console.log(translate('unknown', en)); // '[unknown]'

console.log('\n=== Exercise 7: Implementing an interface ===');
// TODO: Create an interface 'Stack<T>' with:
//   - push(item: T): void
//   - pop(): T | undefined
//   - peek(): T | undefined
//   - readonly size: number
//   - isEmpty(): boolean
// Then implement this interface in a class 'ArrayStack<T>'

// Your code here:
interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  readonly size: number;
  isEmpty(): boolean;
}

class ArrayStack<T> implements Stack<T> {
  private items: T[] = [];

  get size(): number {
    return this.items.length;
  }

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const stack = new ArrayStack<number>();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.peek()); // 3
console.log(stack.pop()); // 3
console.log(stack.size); // 2

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
type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 500;
type ApiResponse<T> =
  | { ok: true; status: HttpStatus; data: T }
  | { ok: false; status: HttpStatus; error: string };

interface ApiClient {
  get<T>(url: string): Promise<ApiResponse<T>>;
  post<T>(url: string, body: unknown): Promise<ApiResponse<T>>;
}

type User = { id: string; name: string; email: string };

class MockApiClient implements ApiClient {
  private mockUser: User = {
    id: '1',
    name: 'Barak Obama',
    email: 'barak.obama@gov.us',
  };

  async get<T>(url: string): Promise<ApiResponse<T>> {
    console.log(`MockAPI - GET request to: ${url}...`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (url.endsWith('/1')) {
      return {
        ok: true,
        status: 200,
        data: this.mockUser as T,
      };
    }

    return {
      ok: false,
      status: 404,
      error: 'User not found in local mockDB',
    };
  }

  async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    console.log(`MockAPI - POST request to: ${url}...`);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (url.length === 0) {
      return {
        ok: false,
        status: 404,
        error: 'Not Found requested Url',
      };
    }

    return {
      ok: true,
      status: 201,
      data: body as T,
    };
  }
}

async function runTests() {
  const client = new MockApiClient();

  console.log('\n=== 🎯 Test 1: Successful GET ===');

  const responseGet200 = await client.get<User>('/user/1');
  console.log('GET 200:', responseGet200);

  console.log('\n=== 🎯 Test 2: Failed GET ===');

  const responseGet404 = await client.get<User>('/user/999');
  console.log('GET 404:', responseGet404);

  console.log('\n=== 🎯 Test 3: Successful POST ===');

  const newUser = {
    id: '2',
    name: 'John Doe',
    email: 'john.doe@gmail.com',
  };
  const responsePost201 = await client.post<User>('/user/2', newUser);
  console.log('POST 201:', responsePost201);

  console.log('\n=== 🎯 Test 4: Failed POST ===');

  const responsePost404 = await client.post<User>('', newUser);
  console.log('POST 404:', responsePost404);
}

runTests();

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
