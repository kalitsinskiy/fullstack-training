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

import { use, useState } from 'react';

// TODO: Define the Todo interface
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// TODO: Create the TodoList component
//
// Suggested structure:
//
// function TodoList() {
//   // State: todos array, input text, nextId
//
//   // Handler: addTodo (called on form submit)
//
//   // Handler: removeTodo (called with an id)
//
//   // Handler: toggleTodo (called with an id)
//
//   // Computed: remaining count
//
//   return (
//     <div>
//       <h2>Todo List</h2>
//
//       {/* Add form */}
//       <form>
//         <input placeholder="What needs to be done?" />
//         <button type="submit">Add</button>
//       </form>
//
//       {/* Todo list or empty message */}
//
//       {/* Remaining count */}
//     </div>
//   );
// }
function TodoList() {
  // State: todos array, input text, nextId
  const [todos, setTodos] = useState<Todo[]>([]);
  const [task, setTask] = useState('');
  const [nextId, setNextId] = useState(1);

  // Handler: addTodo (called on form submit)
  function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    if (!task || !task.trim()) {
      return;
    }

    const todo: Todo = {
      id: nextId,
      text: task.trim(),
      completed: false,
    };

    setTodos((prev) => [...prev, todo]);
    setNextId((prev) => prev + 1);
    setTask('');
  }

  // Handler: removeTodo (called with an id)
  function handleRemove(id: number) {
    setTodos((prev) => prev.filter((task) => task.id !== id));
  }

  // Handler: toggleTodo (called with an id)
  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  // Computed: remaining count
  const remainingCount = todos.filter((t) => !t.completed).length;

  return (
    <div>
      <h2>Todo List</h2>
      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What needs to be done?"
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          style={{
            background: '#2d5a27',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </form>
      {/* Todo list or empty message */}
      {todos.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No todos yet. Add one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {todos.map((task) => (
            <li
              key={task.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid #eee',
              }}
            >
              <span
                style={{
                  cursor: 'pointer',
                  textDecoration: task.completed ? 'line-through' : 'none',
                  color: task.completed ? '#999' : '#333',
                }}
                onClick={() => toggleTodo(task.id)}
              >
                {task.text}
              </span>
              <button
                onClick={() => handleRemove(task.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c0392b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Remaining count */}
      {todos.length > 0 && (
        <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
          {remainingCount} items left
        </p>
      )}
    </div>
  );
}

// TODO: Export default TodoList
export default TodoList;
