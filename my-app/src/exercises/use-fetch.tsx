import { useState, useEffect, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  const refetch = useCallback(() => setTick((prev) => prev + 1), []);

  return { data, loading, error, refetch };
}

interface Post {
  id: number;
  title: string;
  body: string;
}

function PostList() {
  const [postId, setPostId] = useState(1);
  const { data, loading, error, refetch } = useFetch<Post>(
    `https://jsonplaceholder.typicode.com/posts/${postId}`
  );

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>useFetch Demo</h1>

      <div style={{ marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((id) => (
          <button
            key={id}
            onClick={() => setPostId(id)}
            style={{ marginRight: 8, fontWeight: postId === id ? 'bold' : 'normal' }}
          >
            Post {id}
          </button>
        ))}
        <button onClick={refetch} style={{ marginLeft: 16 }}>
          Refetch
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && !loading && (
        <div>
          <h2>{data.title}</h2>
          <p>{data.body}</p>
        </div>
      )}
    </div>
  );
}

export default PostList;
