import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import './App.css';
import Counter from './exercises/counter';
import TodoList from './exercises/todo-list';
import PostList from './exercises/use-fetch';
import ThemeSwitcherApp from './exercises/theme-switcher';
import MultiPageApp from './exercises/multi-page-app';
import ProtectedApp from './exercises/protected-app';

type RouterDemo = 'multi-page' | 'protected';

function App() {
  // Two BrowserRouters cannot coexist — only mount one at a time
  const [activeDemo, setActiveDemo] = useState<RouterDemo | null>(null);

  if (activeDemo === 'multi-page') {
    return (
      <div>
        <button onClick={() => setActiveDemo(null)} style={{ margin: 12 }}>← Back to Exercises</button>
        <MultiPageApp />
      </div>
    );
  }

  if (activeDemo === 'protected') {
    return (
      <div>
        <button onClick={() => setActiveDemo(null)} style={{ margin: 12 }}>← Back to Exercises</button>
        <ProtectedApp />
      </div>
    );
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Exercises</h1>
        </div>
        <Counter />
        <TodoList />
        <PostList />
        <ThemeSwitcherApp />
        <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveDemo('multi-page')}>Open Multi-Page App →</button>
          <button onClick={() => setActiveDemo('protected')}>Open Protected App →</button>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
