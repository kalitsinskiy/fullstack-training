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
  // TODO 1: Create state variables for data, loading, and error

  // TODO 2: Create a fetchData function (async) that:
  //   - Sets loading to true and error to null
  //   - Fetches the URL
  //   - If response is not OK, throws an error with the status
  //   - Parses the JSON response
  //   - Sets data to the parsed response
  //   - Catches errors and sets the error message
  //   - Sets loading to false in all cases

  // TODO 3: Create a useEffect that:
  //   - Calls fetchData
  //   - Uses a `cancelled` flag for cleanup
  //   - Depends on `url`
  //   - Ensures state is NOT updated if `cancelled` is true

  // TODO 4: Create a `refetch` function wrapped in useCallback
  //   that triggers fetchData again

  // TODO 5: Return { data, loading, error, refetch }

  // Remove this placeholder and implement the hook:
  return { data: null, loading: false, error: 'Not implemented', refetch: () => {} };
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
