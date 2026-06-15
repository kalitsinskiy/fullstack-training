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

// ---- TODO: TasksPage component ----

function TasksPage() {
  const [newTitle, setNewTitle] = useState('');
  const queryClient = useQueryClient();

  // TODO 1: useQuery to fetch the task list — queryKey: ['tasks']
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['tasks'],
    queryFn: ({ signal }) => listTasks({ signal }),
    staleTime: 30_000,
  });

  // TODO 2: useMutation for createTask
  //   - onSuccess: invalidateQueries({ queryKey: ['tasks'] }), clear `newTitle`
  //   - onError: alert / setError
  const create = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTitle('');
    },
    onError: (err) => {
      alert(`Create task failed: ${(err as Error).message}`);
    },
  });

  // TODO 3: useMutation for patchTask (toggling `done`) — OPTIMISTIC
  //   - mutationFn: ({ id, done }) => patchTask(id, { done })
  //   - onMutate: cancelQueries, snapshot, setQueryData with the toggled task
  //   - onError: rollback to snapshot
  //   - onSettled: invalidateQueries
  const patch = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => patchTask(id, { done }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(
        ['tasks'],
        (old) => old?.map((t) => (t.id === id ? { ...t, done } : t)) ?? []
      );

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous);
      alert('Patch failed — rolled back');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // TODO 4: useMutation for deleteTask — OPTIMISTIC (same pattern as toggle)
  const remove = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], (old) => old?.filter((t) => t.id !== id) ?? []);

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['tasks'], ctx.previous);
      alert('Delete failed — rolled back');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 540,
        width: '100%',
        margin: '0 auto',
      }}
    >
      <h2>Tasks</h2>

      {/* TODO: form that calls create.mutate(newTitle) on submit */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          create.mutate(newTitle.trim());
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12,
          width: '100%',
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task name"
          id="taskName"
          name="title"
          style={{ padding: 6 }}
        />
        <button type="submit" disabled={create.isPending || !newTitle.trim()}>
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

      {/* TODO: list rendering — handle isLoading, error, empty, success */}
      <ul style={{ width: '100%', listStyle: 'none', padding: 0, marginTop: 32 }}>
        {store.map((task) => (
          <li
            key={task.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              padding: 8,
              borderBottom: '1px solid #eee',
            }}
          >
            <span>{task.title}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => patch.mutate({ id: task.id, done: !task.done })}
                disabled={patch.isPending && patch.variables?.id === task.id}
              >
                {patch.isPending && patch.variables?.id === task.id
                  ? 'Updating...'
                  : task.done
                    ? 'Done'
                    : 'In Progress'}
              </button>
              <button
                onClick={() => remove.mutate(task.id)}
                disabled={remove.isPending && remove.variables === task.id}
              >
                {remove.isPending && remove.variables === task.id ? 'Removing...' : 'Remove'}
              </button>
            </span>
          </li>
        ))}
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
