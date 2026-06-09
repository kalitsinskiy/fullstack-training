import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";
import LoginForm from "./components/LoginForm/LoginForm";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import RoomList, { type Room } from "./components/RoomList";

function App() {
  const [count, setCount] = useState(0);

  const rooms: Room[] = [
    {
      id: "1",
      name: "Holiday Secret Santa",
      code: "HS-9123",
      memberCount: 16,
      status: "pending",
    },
    {
      id: "2",
      name: "Family Gift Swap",
      code: "FS-2024",
      memberCount: 10,
      status: "drawn",
    },
    {
      id: "3",
      name: "Office Holiday Party",
      code: "OH-4512",
      memberCount: 24,
      status: "closed",
    },
    {
      id: "4",
      name: "Friends Gift Exchange",
      code: "FG-3701",
      memberCount: 8,
      status: "pending",
    },
  ];

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <section
        id="auth-forms"
        className="flex flex-col justify-center gap-6 bg-transparent p-8 lg:flex-row"
      >
        <LoginForm />
        <RegisterForm />
      </section>

      <section className="bg-(--bg)">
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6 space-y-2 text-center">
            <p className="text-sm tracking-[0.28em] text-(--muted) uppercase">
              Rooms
            </p>
            <h2 className="text-3xl font-semibold text-(--text)">Your rooms</h2>
            <p className="mx-auto max-w-2xl text-sm text-(--muted)">
              A responsive room grid that adapts to available width and uses
              container queries inside each card.
            </p>
          </div>
          <RoomList rooms={rooms} />
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
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
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
