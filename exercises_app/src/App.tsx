import { useState } from 'react';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Counter from '../exercises/counter';
import TodoList from '../exercises/todo-list';
import ThemeSwitcherApp from '../exercises 2/theme-switcher';
import PostList from '../exercises 2/use-fetch';
import MultiPageApp from '../exercises 3/multi-page-app';
import ProtectedApp from '../exercises 3/protected-app';
import { RoomCardDemo } from '../exercises 4/build-room-card';
import MultiStepCheckout from '../exercises 5/multi-step-checkout';
import ProfileFormDemo from '../exercises 5/profile-form';
import { CrudPage } from '../exercises 6/crud-page';

const queryClient = new QueryClient();

const exercises = [
  { id: 'counter', label: 'Counter', component: <Counter /> },
  { id: 'todo-list', label: 'Todo List', component: <TodoList /> },
  { id: 'theme-switcher', label: 'Theme Switcher', component: <ThemeSwitcherApp /> },
  { id: 'use-fetch', label: 'Use Fetch', component: <PostList /> },
  { id: 'multi-page-app', label: 'Multi-Page App', component: <MultiPageApp /> },
  { id: 'protected-app', label: 'Protected App', component: <ProtectedApp /> },
  { id: 'build-room-card', label: 'Build Room Card', component: <RoomCardDemo /> },
  { id: 'multi-step-checkout', label: 'Multi-Step Checkout', component: <MultiStepCheckout /> },
  { id: 'profile-form', label: 'Profile Form', component: <ProfileFormDemo /> },
  { id: 'crud-page', label: 'CRUD Page', component: <CrudPage /> },
];

function App() {
  const [active, setActive] = useState(exercises[0].id);

  const current = exercises.find((e) => e.id === active)!;

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
