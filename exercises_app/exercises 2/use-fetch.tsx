// ============================================
// Exercise: useFetch Custom Hook
// ============================================
//
// Build a reusable custom hook `useFetch<T>(url)` that fetches data from a URL
// and returns { data, loading, error, refetch }.
//
// Requirements:
// 1. On mount (and when `url` changes), fetch data from the URL
// 2. Track three states: loading, error, and data
// 3. Return a `refetch` function that re-triggers the fetch manually
// 4. Handle race conditions — if `url` changes before a fetch completes,
//    the old response should be ignored (use a cancelled flag)
// 5. Handle non-OK HTTP responses as errors
//
// Test your hook with the demo component at the bottom of this file.
// You can run this in a Vite React app or CodeSandbox.

import { useState, useEffect, useCallback } from 'react';

// ---- Types ----

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---- TODO: Implement useFetch ----

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json: T = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url, fetchCount]);

  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  return { data, loading, error, refetch };
}

// ---- Demo Component (do not modify) ----

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
            style={{
              marginRight: 8,
              fontWeight: postId === id ? 'bold' : 'normal',
            }}
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
