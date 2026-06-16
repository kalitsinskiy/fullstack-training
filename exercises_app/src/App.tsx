import { useState } from 'react'
import './App.css'
import Counter from '../exercises/counter'
import TodoList from '../exercises/todo-list'

const exercises = [
  { id: 'counter', label: 'Counter', component: <Counter /> },
  { id: 'todo-list', label: 'Todo List', component: <TodoList /> },
]

function App() {
  const [active, setActive] = useState(exercises[0].id)

  const current = exercises.find((e) => e.id === active)!

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

      <main id="exercise">
        {current.component}
      </main>
    </div>
  )
}

export default App
