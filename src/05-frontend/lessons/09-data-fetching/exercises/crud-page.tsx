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
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  // TODO 1: useQuery to fetch the task list
  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: listTasks,
  });

  // TODO 2: useMutation for createTask
  const create = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTitle('');
      setCreateError(null);
    },
    onError: (err) => setCreateError((err as Error).message),
  });

  // TODO 3: useMutation for patchTask (toggle done) — OPTIMISTIC
  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => patchTask(id, { done }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.map((t) => (t.id === id ? { ...t, done } : t)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // TODO 4: useMutation for deleteTask — OPTIMISTIC
  const remove = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old?.filter((t) => t.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 540, margin: '0 auto' }}>
      <h2>Tasks</h2>

      {/* Create form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          create.mutate(newTitle.trim());
        }}
        style={{ display: 'flex', gap: 8, marginBottom: 8 }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title"
          style={{ flex: 1, padding: 6 }}
        />
        <button type="submit" disabled={create.isPending || !newTitle.trim()}>
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>
      {createError && (
        <p style={{ color: 'red', margin: '0 0 12px' }}>Error: {createError}</p>
      )}

      {/* List */}
      {isLoading && <p>Loading…</p>}
      {isError && <p style={{ color: 'red' }}>Failed to load: {(error as Error).message}</p>}
      {!isLoading && !isError && tasks.length === 0 && <p>No tasks yet. Add one above.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
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
                padding: '6px 0',
                borderBottom: '1px solid #eee',
                opacity: isDeleting ? 0.4 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={task.done}
                disabled={isToggling}
                onChange={() => toggle.mutate({ id: task.id, done: !task.done })}
              />
              <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#999' : 'inherit' }}>
                {task.title}
              </span>
              <button
                onClick={() => remove.mutate(task.id)}
                disabled={isDeleting}
                style={{ fontSize: 12 }}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          );
        })}
      </ul>
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
