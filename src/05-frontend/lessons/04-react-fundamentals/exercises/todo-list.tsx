/**
 * Exercise: Todo List Component
 *
 * TODO: Build a todo list with add, remove, and toggle functionality.
 *
 * Requirements:
 *
 * 1. DEFINE A Todo INTERFACE:
 *    - id: number
 *    - text: string
 *    - completed: boolean
 *
 * 2. CREATE A TodoList COMPONENT that manages:
 *    - A list of todos (useState with Todo[] type, start with an empty array or a few sample items)
 *    - A text input for the new todo (useState with string type)
 *    - A nextId counter (useState with number type, start at 1)
 *
 * 3. ADD TODO:
 *    - A text input and an "Add" button (or form with onSubmit)
 *    - On submit: create a new Todo object with { id: nextId, text: inputValue, completed: false }
 *    - Add it to the todos array using the spread operator: [...prev, newTodo]
 *    - Clear the input field after adding
 *    - Increment nextId
 *    - Do NOT add empty todos (trim the input, skip if empty)
 *
 * 4. REMOVE TODO:
 *    - Each todo item has a "Remove" button
 *    - On click: filter out the todo with that id
 *      setTodos(prev => prev.filter(t => t.id !== id))
 *
 * 5. TOGGLE TODO:
 *    - Clicking the todo text (or a checkbox) toggles its completed status
 *    - Use .map() to update: setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
 *    - Completed todos should have line-through text decoration and muted color
 *
 * 6. DISPLAY:
 *    - Show a list of todos, each with:
 *      a) A checkbox or clickable text to toggle completion
 *      b) The todo text (with strikethrough if completed)
 *      c) A "Remove" button
 *    - Show the count: "X items left" (count only incomplete todos)
 *    - Show "No todos yet. Add one!" when the list is empty
 *
 * 7. KEY PROP:
 *    - Use todo.id as the key prop on each list item
 *    - Do NOT use the array index as the key
 *
 * 8. EXPORT the TodoList component as default
 *
 * Hints:
 * - Look at examples/lists-and-conditionals.tsx for list rendering and add/remove patterns
 * - Look at examples/state-and-events.tsx for controlled form inputs
 * - Use <form onSubmit={handleAdd}> to support Enter key submission
 * - For the checkbox: <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
 * - Filter for remaining count: todos.filter(t => !t.completed).length
 *
 * To test: copy this file into your Vite + React + TS project (e.g., src/exercises/todo-list.tsx)
 * and import it in App.tsx:
 *
 *   import TodoList from './exercises/todo-list';
 *   function App() { return <TodoList />; }
 */

import React, { useState } from 'react';

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
    setInput('');
    setNextId((prev) => prev + 1);
  }

  function removeTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  const remaining = todos.filter((t) => !t.completed).length;

  return (
    <div style={{ padding: '1rem', maxWidth: '400px' }}>
      <h2>Todo List</h2>

      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', margin: '0.75rem 0' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What needs to be done?"
          style={{ flex: 1 }}
        />
        <button type="submit">Add</button>
      </form>

      {todos.length === 0 ? (
        <p>No todos yet. Add one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {todos.map((todo) => (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  color: todo.completed ? '#9ca3af' : 'inherit',
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

      <p>
        {remaining} item{remaining !== 1 ? 's' : ''} left
      </p>
    </div>
  );
}

export default TodoList;
