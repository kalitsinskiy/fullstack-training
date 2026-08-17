//Generics usage example

interface Params {
  query: object;
}

interface User {
  name: string;
  surname: string;
}

interface Article {
  title: string;
  author: string;
  content: string;
}

const someUser: User = {
  name: 'Ivan',
  surname: 'Franko',
};

const someArticle: Article = {
  title: 'Random title',
  author: 'Anonimus',
  content: 'Lorem ipsum',
};

function makeRequest<T>(url: string, returnedData: T, params?: Params): T {
  //let obj = {} as T;  //this is type assertion, when we knows more than TS
  //return obj;
  return returnedData;
}

const myUser = makeRequest<User>('/getUsers', someUser);
console.log(myUser);

const myArticle = makeRequest<Article>('/getArticles', someArticle);
console.log(myArticle);

//extends************************************************************************************************************
interface BasicPersonInfo {
  name: string;
}

function interactionWithPerson<T extends BasicPersonInfo>(args: T): string {
  return args.name;
}

interactionWithPerson({ name: 'Ivan', age: 40 }); // name property is must here

//typeguards*********************************************************************************************************
interface IAnimal {
  name: string;
}

interface IPet extends IAnimal {
  speak(): string;
}

interface IWild extends IAnimal {
  color: string;
}

// Example object that could be Pet or Wild
const unknownAnimal: IAnimal = {
  name: 'Murzik',
  speak: () => 'Meow!',
};

// Type guard to check if Animal is Pet
// 'is Pet' is special TypeScript syntax for a type guard, but at runtime function returns boolean
function isPet(animal: IAnimal): animal is IPet {
  return typeof (animal as IPet).speak === 'function';
}

if (isPet(unknownAnimal)) {
  // TypeScript knows unknownAnimal is Pet here
  console.log(`${unknownAnimal.name} says:`, unknownAnimal.speak());
} else {
  console.log(`${unknownAnimal.name} is not a home pet.`);
}

//keyof - getting keys of a type*****************************************************************************************

function getUserProperty(user: User, key: keyof User) {
  return user[key];
}

const user: User = {
  name: 'Ivan',
  surname: 'Franko',
};

getUserProperty(user, 'name'); // ✅ OK // should be one of existing User keys
getUserProperty(user, 'surname'); // ✅ OK
// getUserProperty(user, 'age');  // ❌ Error: "age" is not a key of User

//extends keyof — restrict generics to valid keys ***********************************************************************

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user1: User = {
  name: 'Taras',
  surname: 'Shevchenko',
};

const userName = getProperty(user1, 'name'); // string
const userSurname = getProperty(user1, 'surname'); // string
console.log(userName);
console.log(userSurname);

// K extends keyof T means:

// “K must be one of the keys of T”

// T[K] is the type of the property
// TypeScript infers exact return types

//“in keyof” mapped types***********************************************************************************************

type OptionalUser = {
  [Key in keyof User]?: User[Key];
};
// Result:

// type OptionalUser = {
//   name?: string;
//   surname?: string;
// };

// keyof User
// "name" | "surname"
// [Key in "name" | "surname"]

// // First iteration
// Key = "name"

// // Second iteration
// Key = "surname"
// User[Key] means:

// “Give me the type of this property from User”

// User["name"]    // string
// User["surname"] // string

//infer*****************************************************************************************************************
type ElementType<T> = T extends (infer U)[] ? U : T;

type A = ElementType<string[]>; // string
type B = ElementType<number[]>; // number
type C = ElementType<boolean>; // boolean

//infer with functions
type ReturnTypeCustom<T> = T extends (...args: any[]) => infer R ? R : never;

function sum(a: number, b: number): number {
  return a + b;
}

type SumReturn = ReturnTypeCustom<typeof sum>; // number
// Matches function signature
// infer R extracts return type
// This is exactly how built‑in ReturnType<T> works
