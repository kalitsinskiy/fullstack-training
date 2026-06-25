/**
 * Exercise: CRUD page with TanStack Query
 *
 * Build a Tasks page that supports:
 *   - GET    /tasks         → list of tasks (queryKey: ['tasks'])
 *   - POST   /tasks         → create task   (invalidates ['tasks'])
 *   - PATCH  /tasks/:id     → update task   (optimistic, rollback on error)
 *   - DELETE /tasks/:id     → delete task   (optimistic, rollback on error)
 *
 * The fake API at the bottom of this file simulates the network with
 * a 20% random failure rate so you exercise the error/rollback paths.
 *
 * Requirements:
 * 1. useQuery for the list — show loading + error + empty states.
 * 2. useMutation for create — invalidate ['tasks'] on success, show server error.
 * 3. useMutation for "toggle complete" — optimistic, rollback on error.
 * 4. useMutation for delete — optimistic, rollback on error.
 * 5. The form for "new task" should clear after a successful create.
 * 6. While a per-row mutation is in flight, that row's button should show
 *    a pending state — use mutation.variables to identify which row.
 */

import { useState } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

// ---- Types ----

interface Task {
  id: string;
  title: string;
  done: boolean;
}

// ---- Fake API ----

let store: Task[] = [
  { id: '1', title: 'Set up project', done: true },
  { id: '2', title: 'Implement auth', done: false },
  { id: '3', title: 'Write tests', done: false },
];
let nextId = 4;
const FAIL_RATE = 0.2;

async function listTasks(): Promise<Task[]> {
  await new Promise((r) => setTimeout(r, 300));
  return [...store];
}
async function createTask(title: string): Promise<Task> {
  await new Promise((r) => setTimeout(r, 350));
  if (Math.random() < FAIL_RATE) throw new Error('Server rejected create');
  const t: Task = { id: String(nextId++), title, done: false };
  store = [...store, t];
  return t;
}
async function patchTask(id: string, patch: Partial<Task>): Promise<Task> {
  await new Promise((r) => setTimeout(r, 350));
  if (Math.random() < FAIL_RATE) throw new Error('Server rejected update');
  const idx = store.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Not found');
  const next = { ...store[idx], ...patch };
  store = store.map((t, i) => (i === idx ? next : t));
  return next;
}
async function deleteTask(id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 350));
  if (Math.random() < FAIL_RATE) throw new Error('Server rejected delete');
  store = store.filter((t) => t.id !== id);
}

// ---- TasksPage component ----

function TasksPage() {
  const [newTitle, setNewTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const qc = useQueryClient();

  // TODO 1: fetch task list; staleTime keeps it from re-fetching on every focus
  const {
    data: tasks,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: listTasks,
  });

  // TODO 2: create — server-confirmed (no optimistic), invalidate on success
  const create = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setNewTitle('');
      setCreateError(null);
    },
    onError: (err: Error) => setCreateError(err.message),
  });

  // TODO 3: toggle done — optimistic update, rollback on server error
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => patchTask(id, { done }),
    onMutate: async ({ id, done }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = qc.getQueryData<Task[]>(['tasks']);
      qc.setQueryData<Task[]>(
        ['tasks'],
        (old) => old?.map((t) => (t.id === id ? { ...t, done } : t)) ?? []
      );
      return { snapshot }; // returned as `context` in onError
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) qc.setQueryData(['tasks'], context.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // TODO 4: delete — optimistic removal, rollback on server error
  const remove = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const snapshot = qc.getQueryData<Task[]>(['tasks']);
      qc.setQueryData<Task[]>(['tasks'], (old) => old?.filter((t) => t.id !== id) ?? []);
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) qc.setQueryData(['tasks'], context.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div
      style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 540, margin: '0 auto' }}
    >
      <h2>Tasks</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          create.mutate(newTitle.trim());
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 4 }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title…"
          style={{ flex: 1, padding: '6px 10px' }}
          disabled={create.isPending}
        />
        <button type="submit" disabled={create.isPending || !newTitle.trim()}>
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>
      {createError && <p style={{ color: 'red', margin: '4px 0 12px' }}>{createError}</p>}

      {isLoading && <p>Loading…</p>}
      {fetchError && <p style={{ color: 'red' }}>Failed to load tasks.</p>}
      {tasks && tasks.length === 0 && <p style={{ color: '#888' }}>No tasks yet.</p>}

      {tasks && tasks.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {tasks.map((task) => {
            const isToggling = toggle.isPending && toggle.variables?.id === task.id;
            const isDeleting = remove.isPending && remove.variables === task.id;

            return (
              <li
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                  opacity: isDeleting ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <button
                  onClick={() => toggle.mutate({ id: task.id, done: !task.done })}
                  disabled={isToggling || isDeleting}
                  style={{ minWidth: 32, cursor: 'pointer' }}
                  title="Toggle complete"
                >
                  {isToggling ? '…' : task.done ? '✓' : '○'}
                </button>
                <span
                  style={{
                    flex: 1,
                    textDecoration: task.done ? 'line-through' : 'none',
                    color: task.done ? '#999' : 'inherit',
                  }}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => remove.mutate(task.id)}
                  disabled={isDeleting || isToggling}
                  style={{ color: 'red', cursor: 'pointer' }}
                  title="Delete task"
                >
                  {isDeleting ? '…' : '✕'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---- Demo wrapper ----

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } });

export default function CrudPageDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <TasksPage />
    </QueryClientProvider>
  );
}
