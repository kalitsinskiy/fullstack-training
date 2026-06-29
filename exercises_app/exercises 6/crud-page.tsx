import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import './crud-page.css';

export function CrudPage() {
  const [newTitle, setNewTitle] = useState('');
  const {
    tasks,
    isLoading,
    error,
    createTask,
    isCreating,
    createError,
    toggleTask,
    isToggling,
    deleteTask,
    isDeleting,
  } = useTasks();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTask(newTitle.trim(), {
      onSuccess: () => setNewTitle(''),
    });
  };

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p className="error">Failed to load tasks.</p>;

  return (
    <div className="tasks-container">
      <h2>Tasks</h2>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title…"
        />
        <button type="submit" disabled={isCreating || !newTitle.trim()}>
          {isCreating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {createError && <p className="error">{createError.message}</p>}

      <ul className="task-list">
        {tasks?.map((task) => (
          <li key={task.id} className={isDeleting(task.id) ? 'task-item deleting' : 'task-item'}>
            <button
              onClick={() => toggleTask({ id: task.id, done: !task.done })}
              disabled={isToggling(task.id)}
            >
              {isToggling(task.id) ? '…' : task.done ? '✓' : '○'}
            </button>
            <span className={task.done ? 'title done' : 'title'}>{task.title}</span>
            <button
              onClick={() => deleteTask(task.id)}
              disabled={isDeleting(task.id)}
              className="delete-btn"
            >
              {isDeleting(task.id) ? '…' : '✕'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
