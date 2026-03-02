export {};
// ============================================
// UTILITY TYPES Examples
// ============================================
// Run this file with: npx ts-node src/02-typescript/06-utility-types/examples/utility-types.ts

// Base type we'll transform throughout the examples
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}


console.log('=== 1. Partial<T> ===');

// All properties become optional — perfect for update payloads
type UserUpdate = Partial<User>;
// Equivalent to: { id?: string; name?: string; email?: string; ... }

function updateUser(current: User, patch: UserUpdate): User {
  return { ...current, ...patch };
}

const alice: User = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  role: 'user',
  createdAt: new Date('2024-01-01'),
};

const updated = updateUser(alice, { name: 'Alicia', age: 31 });
console.log('Updated name:', updated.name);
console.log('Updated age:', updated.age);


console.log('\n=== 2. Required<T> ===');

// All properties become required — opposite of Partial
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type FullConfig = Required<Config>;
// { host: string; port: number; debug: boolean }

function startServer(config: FullConfig): void {
  console.log(`Starting on ${config.host}:${config.port} (debug: ${config.debug})`);
}

// Must provide all fields
startServer({ host: 'localhost', port: 3000, debug: false });


console.log('\n=== 3. Readonly<T> ===');

type ImmutableUser = Readonly<User>;
// All properties have 'readonly' modifier

const frozenUser: ImmutableUser = { ...alice };
console.log('Name:', frozenUser.name);
// frozenUser.name = 'Bob'; // ❌ Cannot assign to 'name' because it is a read-only property

// Useful for function parameters that should not be mutated
function displayUser(user: Readonly<User>): string {
  return `${user.name} (${user.role})`;
}
console.log(displayUser(alice));


console.log('\n=== 4. Pick<T, K> ===');

// Keep only specified properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: string; name: string }

type UserContact = Pick<User, 'name' | 'email'>;
// { name: string; email: string }

function renderUserCard(user: UserPreview): string {
  return `[${user.id}] ${user.name}`;
}
console.log(renderUserCard({ id: 'u1', name: 'Alice' }));

// Common pattern: Pick for API responses (don't expose internal fields)
type PublicProfile = Pick<User, 'id' | 'name' | 'role'>;
const profile: PublicProfile = { id: alice.id, name: alice.name, role: alice.role };
console.log('Public profile:', profile);


console.log('\n=== 5. Omit<T, K> ===');

// Remove specified properties
type UserWithoutId = Omit<User, 'id'>;
type UserCreateDto = Omit<User, 'id' | 'createdAt'>; // data needed to create a user

function createUser(dto: UserCreateDto): User {
  return {
    ...dto,
    id: `u_${Date.now()}`,
    createdAt: new Date(),
  };
}

const newUser = createUser({
  name: 'Bob',
  email: 'bob@example.com',
  age: 25,
  role: 'user',
});
console.log('Created user:', newUser.id, newUser.name);


console.log('\n=== 6. Record<K, V> ===');

// Create an object type with specific key and value types
type RolePermissions = Record<'admin' | 'user' | 'guest', string[]>;

const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete', 'manage'],
  user: ['read', 'write'],
  guest: ['read'],
};
console.log('Admin perms:', permissions.admin);
console.log('Guest perms:', permissions.guest);

// Record with any string keys
type DataCache = Record<string, unknown>;
const cache: DataCache = {};
cache['user_1'] = alice;
cache['config'] = { debug: true };
console.log('Cache keys:', Object.keys(cache));

// Common pattern: mapping enum values to data
type StatusMessages = Record<number, string>;
const httpMessages: StatusMessages = {
  200: 'OK',
  404: 'Not Found',
  500: 'Internal Server Error',
};
console.log('404 message:', httpMessages[404]);


console.log('\n=== 7. Exclude<T, U> and Extract<T, U> ===');

type AllRoles = 'admin' | 'user' | 'guest' | 'moderator';

// Exclude — remove from union
type NonAdminRoles = Exclude<AllRoles, 'admin'>;       // 'user' | 'guest' | 'moderator'
type BasicRoles = Exclude<AllRoles, 'admin' | 'moderator'>; // 'user' | 'guest'

// Extract — keep only matching
type PrivilegedRoles = Extract<AllRoles, 'admin' | 'moderator'>; // 'admin' | 'moderator'

const regular: BasicRoles = 'user';
const privileged: PrivilegedRoles = 'admin';
console.log('Basic role:', regular);
console.log('Privileged role:', privileged);

// Useful with string unions
type EventName = 'click' | 'focus' | 'blur' | 'mouseenter' | 'mouseleave';
type MouseEvents = Extract<EventName, `mouse${string}`>; // 'mouseenter' | 'mouseleave'
const mouseEvent: MouseEvents = 'mouseenter';
console.log('Mouse event:', mouseEvent);


console.log('\n=== 8. NonNullable<T> ===');

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

type MaybeUser = User | null | undefined;
type DefiniteUser = NonNullable<MaybeUser>; // User

function processName(name: MaybeString): DefiniteString {
  if (name == null) throw new Error('Name required');
  return name;
}
console.log('Processed:', processName('Alice'));


console.log('\n=== 9. ReturnType<T> and Parameters<T> ===');

function formatUser(user: User, showEmail: boolean): string {
  const email = showEmail ? ` <${user.email}>` : '';
  return `${user.name}${email}`;
}

// Extract types without re-declaring them
type FormatResult = ReturnType<typeof formatUser>;      // string
type FormatParams = Parameters<typeof formatUser>;      // [User, boolean]

const args: FormatParams = [alice, true];
const result: FormatResult = formatUser(...args);
console.log('Formatted:', result);

// Very useful for working with third-party functions
const handler = setTimeout(() => {}, 1000);
type TimerHandle = ReturnType<typeof setTimeout>; // NodeJS.Timeout or number
const handle: TimerHandle = handler;
clearTimeout(handle);


console.log('\n=== 10. Awaited<T> ===');

async function fetchUser(id: string): Promise<User> {
  return { ...alice, id };
}

async function fetchUsers(): Promise<User[]> {
  return [alice];
}

// Extract the resolved type
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;    // User
type FetchedUsers = Awaited<ReturnType<typeof fetchUsers>>;  // User[]

async function main() {
  const user: FetchedUser = await fetchUser('u1');
  const users: FetchedUsers = await fetchUsers();
  console.log('Fetched user:', user.name);
  console.log('Fetched users count:', users.length);
}
main().catch(console.error);


console.log('\n=== 11. Combining utility types ===');

// Real-world pattern: CRUD DTOs (note: UserCreateDto already defined above — reusing it)
type UserUpdateDto = Partial<Omit<User, 'id' | 'createdAt'>>;
type UserResponse = Readonly<Omit<User, 'email'>>; // public-safe, immutable

// Real-world pattern: Form state
type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
};
type UserForm = {
  [K in keyof UserCreateDto]: FormField<UserCreateDto[K]>;
};

const form: UserForm = {
  name: { value: '', error: 'Required', touched: false },
  email: { value: '', touched: false },
  age: { value: 0, touched: false },
  role: { value: 'user', touched: false },
};
console.log('Form name error:', form.name.error);

console.log('\n✅ Utility types examples complete!');

// Exported for type reference — these demonstrate utility type results
export type { UserContact, UserWithoutId, NonAdminRoles, DefiniteUser, UserUpdateDto, UserResponse };
