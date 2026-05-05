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
 *
 * Setup (once per project):
 *   npm install @tanstack/react-query
 *   npm install -D @tanstack/react-query-devtools
 *   Wrap App with <QueryClientProvider client={queryClient}>.
 *
 * Run: render <CrudPageDemo /> in App.tsx.
 */

/* eslint-disable */
// @ts-nocheck — exercise stub. Remove this directive after implementing.

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

// ---- TODO: TasksPage component ----

function TasksPage() {
  const [newTitle, setNewTitle] = useState('');

  // TODO 1: useQuery to fetch the task list — queryKey: ['tasks']

  // TODO 2: useMutation for createTask
  //   - onSuccess: invalidateQueries({ queryKey: ['tasks'] }), clear `newTitle`
  //   - onError: alert / setError

  // TODO 3: useMutation for patchTask (toggling `done`) — OPTIMISTIC
  //   - mutationFn: ({ id, done }) => patchTask(id, { done })
  //   - onMutate: cancelQueries, snapshot, setQueryData with the toggled task
  //   - onError: rollback to snapshot
  //   - onSettled: invalidateQueries

  // TODO 4: useMutation for deleteTask — OPTIMISTIC (same pattern as toggle)

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif', maxWidth: 540, margin: '0 auto' }}>
      <h2>Tasks</h2>

      {/* TODO: form that calls create.mutate(newTitle) on submit */}
      <p>TODO: implement the create form (input + submit button)</p>

      {/* TODO: list rendering — handle isLoading, error, empty, success */}
      <p>TODO: render task list with toggle + delete per row</p>
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
