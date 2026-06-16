import { useState } from 'react';
import './exercises.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(1);

  function addTodo(e: React.FormEvent<HTMLFormElement>) {
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
    <div className="exercise-card">
      <form className="todo-form" onSubmit={addTodo}>
        <input
          className="todo-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>

      {todos.length === 0 ? (
        <p className="todo-empty">No todos yet. Add one!</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                className="todo-checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className="todo-text" onClick={() => toggleTodo(todo.id)}>
                {todo.text}
              </span>
              <button className="btn-remove" onClick={() => removeTodo(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <p className="todo-remaining">{remaining} item{remaining !== 1 ? 's' : ''} left</p>
      )}
    </div>
  );
}

export default TodoList;
