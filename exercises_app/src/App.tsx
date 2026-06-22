import { useState } from 'react';
import './App.css';
import Counter from '../exercises/counter';
import TodoList from '../exercises/todo-list';
import ThemeSwitcherApp from '../exercises 2/theme-switcher';
import PostList from '../exercises 2/use-fetch';
import MultiPageApp from '../exercises 3/multi-page-app';
import ProtectedApp from '../exercises 3/protected-app';
import { RoomCardDemo } from '../exercises 4/build-room-card';

const exercises = [
  { id: 'counter', label: 'Counter', component: <Counter /> },
  { id: 'todo-list', label: 'Todo List', component: <TodoList /> },
  { id: 'theme-switcher', label: 'Theme Switcher', component: <ThemeSwitcherApp /> },
  { id: 'use-fetch', label: 'Use Fetch', component: <PostList /> },
  { id: 'multi-page-app', label: 'Multi-Page App', component: <MultiPageApp /> },
  { id: 'protected-app', label: 'Protected App', component: <ProtectedApp /> },
  { id: 'build-room-card', label: 'Build Room Card', component: <RoomCardDemo /> },
];

function App() {
  const [active, setActive] = useState(exercises[0].id);

  const current = exercises.find((e) => e.id === active)!;

  return (
    <div id="app">
      <nav id="tabs">
        {exercises.map((ex) => (
          <button
            key={ex.id}
            className={ex.id === active ? 'tab active' : 'tab'}
            onClick={() => setActive(ex.id)}
          >
            {ex.label}
          </button>
        ))}
      </nav>

      <main id="exercise">{current.component}</main>
    </div>
  );
}

export default App;
