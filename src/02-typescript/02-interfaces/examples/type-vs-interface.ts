export {};
// ============================================
// TYPE vs INTERFACE — Practical Comparison
// ============================================
// Run this file with: npx ts-node src/02-typescript/02-interfaces/examples/type-vs-interface.ts

console.log('=== 1. Object shape — both work equally ===');

interface IUser {
  id: number;
  name: string;
}

type TUser = {
  id: number;
  name: string;
};

const userA: IUser = { id: 1, name: 'Alice' };
const userB: TUser = { id: 2, name: 'Bob' };
console.log('Interface user:', userA);
console.log('Type user:', userB);


console.log('\n=== 2. Union types — only type can do this ===');

// type CAN create unions
type StringOrNumber = string | number;
type Status = 'active' | 'inactive' | 'pending';
type NullableUser = TUser | null;

let id: StringOrNumber = 1;
id = 'user_1'; // valid
console.log('Union id:', id);

// interface CANNOT:
// interface Status = 'active' | 'inactive'; // ❌ syntax error


console.log('\n=== 3. Extending ===');

// Interface uses 'extends'
interface IAnimal {
  name: string;
}
interface IDog extends IAnimal {
  breed: string;
}

// Type uses intersection (&)
type TAnimal = { name: string };
type TDog = TAnimal & { breed: string };

const dog1: IDog = { name: 'Rex', breed: 'Lab' };
const dog2: TDog = { name: 'Max', breed: 'Poodle' };
console.log('Interface dog:', dog1);
console.log('Type dog:', dog2);

// Cross-usage: type can extend interface and vice versa
interface ITimestamped {
  createdAt: Date;
}
type TEntity = TUser & ITimestamped; // type extends interface ✅

interface IAdmin extends TUser {     // interface extends type ✅
  role: 'admin';
}


console.log('\n=== 4. Declaration merging — only interface can do this ===');

interface IConfig {
  host: string;
}
interface IConfig {
  port: number; // merges with the first declaration
}
// Both properties are now required:
const cfg: IConfig = { host: 'localhost', port: 3000 };
console.log('Merged config:', cfg);

// type cannot merge:
type TConfig = { host: string };
// type TConfig = { port: number }; // ❌ Duplicate identifier 'TConfig'


console.log('\n=== 5. When type is the ONLY option ===');

// Tuple
type Coordinate = [number, number];
type RGBColor = [number, number, number];

const point: Coordinate = [10, 20];
const red: RGBColor = [255, 0, 0];
console.log('Point:', point, 'Color:', red);

// Complex union
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function processResponse(res: ApiResponse<IUser>): void {
  if (res.success) {
    console.log('Got user:', res.data.name);
  } else {
    console.log('Error:', res.error);
  }
}
processResponse({ success: true, data: { id: 1, name: 'Alice' } });
processResponse({ success: false, error: 'Not found' });

// Primitive alias
type UserId = string;
type EmailAddress = string;
function sendEmail(to: EmailAddress, from: EmailAddress): void {
  console.log(`Sending from ${from} to ${to}`);
}
sendEmail('user@example.com', 'noreply@app.com');

// Mapped type (covered more in utility types module)
type ReadonlyUser = {
  readonly [K in keyof TUser]: TUser[K];
};


console.log('\n=== 6. Practical decision guide ===');

// ✅ Use interface for:
//   - Object shapes (especially if a class will implement it)
//   - Public API types in libraries
//   - When you need declaration merging

// ✅ Use type for:
//   - Union types: type Status = 'a' | 'b'
//   - Intersections: type Admin = User & HasRole
//   - Tuples: type Pair = [string, number]
//   - Utility types: type ReadonlyUser = Readonly<User>
//   - Complex generics / conditional types

console.log('Rule of thumb: interface for objects/classes, type for everything else.');

console.log('\n✅ Type vs Interface examples complete!');

// Exported for type reference — these demonstrate type alias capabilities
export type { Status, NullableUser, TEntity, IAdmin, TConfig, UserId, ReadonlyUser };
