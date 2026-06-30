import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';

interface Assignment {
  assigneeId: string;
  assigneeName: string;
}

export function MyAssignment({ roomId }: { roomId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', roomId, 'assignment'],
    queryFn: () => api.get<Assignment>(`/api/rooms/${roomId}/assignment`),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return false;
      return failureCount < 3;
    },
  });

  if (isLoading) return <p className="text-sm text-gray-400">Loading assignment…</p>;

  if (error instanceof ApiError && (error.status === 404 || error.status === 409)) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
        Awaiting draw
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">Failed to load assignment.</p>;

  if (!data) return null;

  return (
    <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
      <p className="text-sm text-blue-700">
        You are buying a gift for <strong>{data.assigneeName}</strong>.
      </p>
    </div>
  );
}
