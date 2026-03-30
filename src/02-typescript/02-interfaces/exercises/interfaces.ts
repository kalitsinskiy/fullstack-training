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
  name: 'Kartoha',
  price: 200,
  sku: 'Bag',
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
  vaccinated: boolean;
}
const cat: Pet = {
  name: 'Murzik',
  speak() {
    return 'Meow';
  },
  owner: 'Nobody',
  vaccinated: false,
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
type THttpMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
interface IApiRequest {
  url: string;
  method: THttpMethods;
  body?: unknown;
  headers?: Record<string, string>;
}
const request: IApiRequest = {
  url: 'https://bye-world.com',
  method: 'GET',
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
interface IAppConfig {
  theme: 'light' | 'dark';
  language: string;
}
interface IAppConfig {
  version: string;
  debug: boolean;
}

const appConfig: IAppConfig = {
  theme: 'light',
  language: 'ua',
  version: '0.0.1',
  debug: true,
};

console.log(appConfig.theme, appConfig.version);

console.log('\n=== Exercise 5: type vs interface choice ===');
// TODO: For each of the following, decide whether to use 'type' or 'interface' and implement it:
// a) A shape that can be 'circle', 'square', or 'triangle' with appropriate properties
// b) A 'Repository<T>' shape with methods: findById, findAll, save, delete
// c) A tuple representing a database row: [id: number, name: string, createdAt: Date]
// d) An intersection of 'Auditable' ({ createdBy: string }) and 'Deletable' ({ deletedAt?: Date })

// Your code here:
//A
type Circle = {
  kind: 'circle';
  radius: number;
};
type Square = {
  kind: 'square';
  side: number;
};
type Triangle = {
  kind: 'triangle';
  sideA: number;
  sideB: number;
  sideC: number;
  angle: number;
};
type Shape = Circle | Square | Triangle;
const figure: Shape = { kind: 'circle', radius: 10 };
console.log(figure);

//B
interface Repository<T> {
  findById(id: number): T | undefined;
  findAll(): T[];
  save(entity: T): void;
  delete(id: number): boolean;
}
class ProductRepo implements Repository<Product> {
  private items: Product[] = [];
  findById(id: number) {
    return this.items.find((p) => p.id === id);
  }
  findAll() {
    return this.items;
  }
  save(entity: Product) {
    const idx = this.items.findIndex((p) => p.id === entity.id);
    if (idx >= 0) this.items[idx] = entity;
    else this.items.push(entity);
  }
  delete(id: number) {
    const idx = this.items.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      return true;
    }
    return false;
  }
}
const repo = new ProductRepo();
repo.save(product);
console.log(repo.findAll());

//C
type Row = [id: number, name: string, createdAt: Date];
const row: Row = [2, 'User', new Date('2026-01-01')];
console.log(row);

//D An intersection of 'Auditable' ({ createdBy: string }) and 'Deletable' ({ deletedAt?: Date })
type Auditable = { createdBy: string };
type Deletable = { deletedAt?: Date };
type Item = Auditable & Deletable;
const item: Item = { createdBy: '2026-01-01' };
console.log(item);

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
function translate(key: string, map: TranslationMap): string {
  return key in map ? map[key] : `[${key}]`;
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
  items: T[] = [];
  push(item: T): void {
    this.items.push(item);
  }
  pop(): T | undefined {
    return this.items.pop();
  }
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  get size(): number {
    return this.items.length;
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

function isApiFailure<T>(
  response: ApiResponse<T>
): response is { ok: false; status: HttpStatus; error: string } {
  return response.ok === false;
}

type User = {
  id: number;
  name: string;
  email: string;
};

const client: ApiClient = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    if (url === '/users/1') {
      const user: User = {
        id: 1,
        name: 'Taras Shevchenko',
        email: 'yak-umru-to-pohovayte@example.com',
      };

      return {
        ok: true,
        status: 200,
        data: user as T,
      };
    }

    return {
      ok: false,
      status: 404,
      error: 'Resource not found',
    };
  },

  async post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
    return {
      ok: false,
      status: 500,
      error: 'Internal error',
    };
  },
};

(async function (): Promise<void> {
  const existingUserResponse = await client.get<User>('/users/1');

  if (isApiFailure(existingUserResponse)) {
    console.log(`Request failed: ${existingUserResponse.error}`);
  } else {
    console.log(
      `Loaded user: ${existingUserResponse.data.name} (${existingUserResponse.data.email})`
    );
  }

  const missingUserResponse = await client.get<User>('/users/100');

  if (isApiFailure(missingUserResponse)) {
    console.log(
      `Request failed with status ${missingUserResponse.status}: ${missingUserResponse.error}`
    );
  } else {
    console.log(`Loaded user: ${missingUserResponse.data.name}`);
  }
})();

console.log('\n✅ Exercises completed! Check your answers with a mentor.');
