import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // bind 0.0.0.0 so the dev server is reachable on the LAN
    // Same-origin proxy: with VITE_API_URL / VITE_WS_URL empty (the default in
    // .env.example), the app calls `/api` and `/socket.io` on its own origin and
    // Vite forwards them to the backends on localhost. So a phone/other device on
    // the LAN needs no CORS and no hardcoded host IP, and it keeps working when
    // your machine's IP changes. The Origin is rewritten to the always-allowed
    // localhost:5173 so the backends' CORS (including Socket.IO) accept it.
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,
        changeOrigin: true,
        headers: { origin: 'http://localhost:5173' },
      },
      '/api/notifications': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        headers: { origin: 'http://localhost:5173' },
      },
      '/api/messages': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        headers: { origin: 'http://localhost:5173' },
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        headers: { origin: 'http://localhost:5173' },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
