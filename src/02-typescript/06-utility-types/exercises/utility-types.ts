export {};
// ============================================
// UTILITY TYPES Exercises
// ============================================
// Complete the TODO exercises below
// Run this file with: npx ts-node src/02-typescript/06-utility-types/exercises/utility-types.ts

// Base types to use throughout these exercises
interface Article {
  id: string;
  title: string;
  body: string;
  authorId: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
}

console.log('=== Exercise 1: Partial for updates ===');
// TODO: Create type 'ArticleUpdate' using Partial — for PATCH requests
//       (all fields optional, but exclude id, createdAt, authorId since those can't change)
// Then write function 'patchArticle(article: Article, update: ArticleUpdate): Article'

// Your code here:
type ArticleUpdate = Partial<Omit<Article, 'id' | 'createdAt' | 'authorId'>>;
function patchArticle(article: Article, update: ArticleUpdate): Article {
  return {
    ...article,
    ...update,
    updatedAt: new Date(),
  };
}

<<<<<<< HEAD
const article: Article = {
  id: 'a1',
  title: 'Hello',
  body: 'World',
  authorId: 'u1',
  tags: [],
  published: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const patched = patchArticle(article, { title: 'Updated Title', published: true });
console.log(patched.title, patched.published);
=======
// const article: Article = {
//   id: 'a1', title: 'Hello', body: 'World', authorId: 'u1',
//   tags: [], published: false, createdAt: new Date(), updatedAt: new Date()
// };
// const patched = patchArticle(article, { title: 'Updated Title', published: true });
// console.log(patched.title, patched.published);
>>>>>>> 2367512d4b97d35ea64f250f808568d2d2ba929a

console.log('\n=== Exercise 2: Pick for API responses ===');
// TODO: Create these types using Pick:
//   - 'ArticleListItem': only id, title, tags, published, createdAt
//     (what you'd show in a list — no body to save bandwidth)
//   - 'AuthorPublic': only id, name, bio
//     (no email — private data)
// Write a function 'toListItem(article: Article): ArticleListItem'

// Your code here:
type ArticleListItem = Pick<Article, 'id' | 'title' | 'tags' | 'published' | 'createdAt'>;
type AuthorPublic = Pick<Author, 'id' | 'name' | 'bio'>;

function toListItem(article: Article): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    tags: article.tags,
    published: article.published,
    createdAt: article.createdAt,
  };
}

const item = toListItem(article);
console.log(item.title);
// console.log(item.body); // ❌ should not exist on ArticleListItem

console.log('\n=== Exercise 3: Omit for create DTOs ===');
// TODO: Create these types using Omit:
//   - 'CreateArticleDto': everything except id, createdAt, updatedAt (auto-generated)
//   - 'CreateAuthorDto': everything except id
// Write 'createArticle(dto: CreateArticleDto): Article' that auto-assigns id + timestamps

// Your code here:
type CreateArticleDto = Omit<Article, 'id' | 'createdAt' | 'updatedAt'>;
type CreateAuthorDto = Omit<Author, 'id'>;

function createArticle(dto: CreateArticleDto): Article {
  const now = new Date();

<<<<<<< HEAD
  return {
    ...dto,
    id: `art_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
}

const dto: CreateArticleDto = {
  title: 'New Post',
  body: '...',
  authorId: 'u1',
  tags: ['ts'],
  published: false,
};
const newArticle = createArticle(dto);
console.log(newArticle.id, newArticle.createdAt);

=======
>>>>>>> 2367512d4b97d35ea64f250f808568d2d2ba929a
console.log('\n=== Exercise 4: Record ===');
// TODO: Create the following using Record:
//   a) 'ArticleById': maps article id (string) to Article
//   b) 'RoleToPermissions': maps 'admin' | 'editor' | 'viewer' to string[]
//      admin: ['create', 'read', 'update', 'delete']
//      editor: ['create', 'read', 'update']
//      viewer: ['read']
//   c) Function 'hasPermission(role, action)': checks if role can perform action

// Your code here:
type ArticleById = Record<string, Article>;
type Role = 'admin' | 'editor' | 'viewer';
type RoleToPermissions = Record<Role, string[]>;

const permissions: RoleToPermissions = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
};

<<<<<<< HEAD
function hasPermission(role: Role, action: string): boolean {
  const roleActions = permissions[role];
  return roleActions.includes(action);
}

console.log(hasPermission('editor', 'delete')); // false
console.log(hasPermission('admin', 'delete')); // true
console.log(hasPermission('viewer', 'read')); // true

=======
>>>>>>> 2367512d4b97d35ea64f250f808568d2d2ba929a
console.log('\n=== Exercise 5: Exclude and Extract ===');
// TODO: Given the union below:
type EventType =
  | 'click'
  | 'focus'
  | 'blur'
  | 'keydown'
  | 'keyup'
  | 'mouseenter'
  | 'mouseleave'
  | 'scroll';

// a) Create 'KeyboardEvents' — only keyboard events (keydown, keyup)
// b) Create 'MouseEvents' — only events that start with 'mouse'
//    Hint: Extract<EventType, `mouse${string}`>
// c) Create 'NonMouseEvents' — all events except mouse events
// d) Create 'FocusEvents' — Extract focus and blur

// Your code here:
type KeyboardEvents = Extract<EventType, 'keydown' | 'keyup'>;
type MouseEvents = Extract<EventType, `mouse${string}`>;
type NonMouseEvents = Exclude<EventType, `mouse${string}`>;
type FocusEvents = Extract<EventType, 'focus' | 'blur'>;

<<<<<<< HEAD
const kEvent: KeyboardEvents = 'keydown'; // ✅
const mEvent: MouseEvents = 'mouseenter'; // ✅
const otherEvent: NonMouseEvents = 'click'; // ✅
// const invalid: MouseEvents = 'click'; // ❌ Помилка: 'click' не підходить під `mouse${string}`

=======
>>>>>>> 2367512d4b97d35ea64f250f808568d2d2ba929a
console.log('\n=== Exercise 6: ReturnType and Parameters ===');
// TODO: Given these functions (don't modify them):

function searchArticles(_query: string, _tags: string[], _limit: number): Article[] {
  return []; // stub
}

async function loadAuthorWithArticles(
  _authorId: string
): Promise<{ author: Author; articles: Article[] }> {
  return { author: {} as Author, articles: [] }; // stub
}

// These functions are stubs for type extraction — call them if you want to test:
// searchArticles('query', ['tag'], 10);
// loadAuthorWithArticles('author_1').then(console.log);

// Using ONLY ReturnType, Parameters, and Awaited (no manual type writing):
// a) Extract the type of the first parameter of searchArticles
// b) Extract the full return type of searchArticles
// c) Extract the resolved value type of loadAuthorWithArticles (unwrap the Promise)
// d) Extract the type of just the 'articles' property from (c)

// Your type aliases here:
type SearchFirstParam = Parameters<typeof searchArticles>[0];
type SearchResult = ReturnType<typeof searchArticles>;
type LoadedResult = Awaited<ReturnType<typeof loadAuthorWithArticles>>;
type ArticleList = LoadedResult['articles'];

// Verify:
<<<<<<< HEAD
const param: SearchFirstParam = 'typescript';
const result: SearchResult = [];
const loaded: LoadedResult = { author: {} as Author, articles: [] };
const list: ArticleList = result;
=======
// const param: SearchFirstParam = 'typescript';
// const result: SearchResult = [];
// const loaded: LoadedResult = { author: {} as Author, articles: [] };
>>>>>>> 2367512d4b97d35ea64f250f808568d2d2ba929a

console.log('\n=== Exercise 7: Readonly for immutability ===');
// TODO: Write a function 'freeze<T>(obj: T): Readonly<T>'
//       that returns the object cast to Readonly (use Object.freeze internally)
// Then write a function 'deepFreeze<T>(obj: T): DeepReadonly<T>'
//       where DeepReadonly<T> makes all nested objects readonly too
//       Hint: type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] }

// Your code here:
function freeze<T>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

function deepFreeze<T>(obj: T): DeepReadonly<T> {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function') &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return obj as DeepReadonly<T>;
}

const frozen = freeze({ name: 'Alice', tags: ['ts'] });
// frozen.name = 'Bob'; // ❌ should be readonly at compile time

console.log('\n=== 🎯 Challenge: Build utility types from scratch ===');
// TODO: Implement these utility types YOURSELF (without using the built-in versions):
//
// a) MyPartial<T>   — same as Partial<T>
//    Hint: { [K in keyof T]?: T[K] }
//
// b) MyReadonly<T>  — same as Readonly<T>
//    Hint: { readonly [K in keyof T]: T[K] }
//
// c) MyPick<T, K extends keyof T>  — same as Pick<T, K>
//    Hint: { [P in K]: T[P] }
//
// d) MyOmit<T, K extends keyof T>  — same as Omit<T, K>
//    Hint: MyPick<T, Exclude<keyof T, K>>
//
// e) MyRecord<K extends string, V>  — same as Record<K, V>
//    Hint: { [P in K]: V }

// Your implementations here:
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type MyOmit<T, K extends keyof T> = MyPick<T, Exclude<keyof T, K>>;

type MyRecord<K extends keyof any, V> = {
  [P in K]: V;
};

// Verify they work like the built-ins:
type A = MyPartial<Article>; // all optional
type B = MyReadonly<Author>; // all readonly
type C = MyPick<Article, 'id' | 'title'>; // { id: string; title: string }
type D = MyOmit<Article, 'body' | 'authorId'>; // everything else

console.log('\n✅ Exercises completed! Check your answers with a mentor.');

// Pre-provided stubs — exported so TypeScript knows they're used
export type { EventType };
export { searchArticles, loadAuthorWithArticles };
