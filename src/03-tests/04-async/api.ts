export interface ApiUser {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

// Simulates a network request (in real code would call fetch())
export async function fetchUser(id: string): Promise<ApiUser> {
  if (!id) throw new Error('ID is required');
  if (id === 'not-found') throw new Error('User not found');

  // Simulate network delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ id, name: `User ${id}`, email: `${id}@example.com` });
    }, 100);
  });
}

export async function fetchUsers(): Promise<ApiUser[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ]);
    }, 50);
  });
}

export async function retryOperation<T>(
  fn: () => Promise<T>,
  attempts: number,
): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
    }
  }
  throw new Error('Should not reach here');
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number,
): T {
  let timer: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  }) as T;
}

export function scheduleTask(fn: () => void, delayMs: number): void {
  setTimeout(fn, delayMs);
}

export function scheduleRepeating(fn: () => void, intervalMs: number): () => void {
  const id = setInterval(fn, intervalMs);
  return () => clearInterval(id);
}
