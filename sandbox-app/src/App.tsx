import Counter from './04-react-fundamentals/exercises/counter';
import TodoList from './04-react-fundamentals/exercises/todo-list';
import './App.css';

function App() {
  return (
    <>
      <Counter />
      <div style={{ margin: '2rem 0' }}></div>
      <TodoList />
    </>
  );
}

export default App;
