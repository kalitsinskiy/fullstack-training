// Pure functions for testing matchers

export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

export function factorial(n: number): number {
  if (n < 0) throw new RangeError('Factorial of negative number');
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export function createUser(id: number, name: string, email: string): User {
  return { id, name, email, role: 'user' };
}

export function getUserNames(users: User[]): string[] {
  return users.map(u => u.name);
}
