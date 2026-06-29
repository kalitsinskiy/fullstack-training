import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import type { Task } from '../api/tasks';

export function useTasks() {
  const qc = useQueryClient();
  const queryKey = ['tasks'];

  const query = useQuery({ queryKey, queryFn: tasksApi.list });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => tasksApi.update(id, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData<Task[]>(queryKey);
      qc.setQueryData<Task[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, done } : t))
      );
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(queryKey, ctx?.snapshot),
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const snapshot = qc.getQueryData<Task[]>(queryKey);
      qc.setQueryData<Task[]>(queryKey, (old) => old?.filter((t) => t.id !== id));
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(queryKey, ctx?.snapshot),
    onSettled: () => qc.invalidateQueries({ queryKey }),
  });

  return {
    tasks: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    toggleTask: toggleMutation.mutate,
    isToggling: (id: string) => toggleMutation.isPending && toggleMutation.variables?.id === id,
    deleteTask: deleteMutation.mutate,
    isDeleting: (id: string) => deleteMutation.isPending && deleteMutation.variables === id,
  };
}
