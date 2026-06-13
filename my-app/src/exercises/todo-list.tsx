import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(1);

  function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos((prev) => [...prev, { id: nextId, text: input.trim(), completed: false }]);
    setNextId((prev) => prev + 1);
    setInput('');
  }

  function removeTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleTodo(id: number) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div>
      <h2>Todo List</h2>

      <form onSubmit={addTodo}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      {todos.length === 0 ? (
        <p>No todos yet. Add one!</p>
      ) : (
        <ul>
          {todos.map((todo) => (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span
                style={{
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? 'gray' : 'inherit',
                  cursor: 'pointer',
                }}
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.text}
              </span>
              <button onClick={() => removeTodo(todo.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <p>{remaining} items left</p>
    </div>
  );
}

export default TodoList;
