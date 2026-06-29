export interface Task {
  id: string;
  title: string;
  done: boolean;
}

let store: Task[] = [
  { id: '1', title: 'Set up project', done: true },
  { id: '2', title: 'Implement auth', done: false },
  { id: '3', title: 'Write tests', done: false },
];

let nextId = 4;
const FAIL_RATE = 0.2;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const tasksApi = {
  list: async (): Promise<Task[]> => {
    await delay(300);
    return [...store];
  },

  create: async (title: string): Promise<Task> => {
    await delay(350);
    if (Math.random() < FAIL_RATE) throw new Error('Server rejected create');
    const task: Task = { id: String(nextId++), title, done: false };
    store = [...store, task];
    return task;
  },

  update: async (id: string, patch: Partial<Task>): Promise<Task> => {
    await delay(350);
    if (Math.random() < FAIL_RATE) throw new Error('Server rejected update');
    const idx = store.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Not found');
    const updated = { ...store[idx], ...patch };
    store = store.map((t, i) => (i === idx ? updated : t));
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    await delay(350);
    if (Math.random() < FAIL_RATE) throw new Error('Server rejected delete');
    store = store.filter((t) => t.id !== id);
  },
};
