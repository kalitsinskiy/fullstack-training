import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-transition-group/TransitionGroupContext': path.resolve(
        __dirname,
        'node_modules/react-transition-group/cjs/TransitionGroupContext.js',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/test/**',
        'src/components/Layout.tsx',
        'src/components/PageSpinner.tsx',
        'src/components/RootErrorFallback.tsx',
        'src/components/RouteFallback.tsx',
        'src/components/WishlistErrorFallback.tsx',
        'src/hooks/useApi.ts',
        'src/pages/NotFoundPage.tsx',
        'src/pages/WishlistPage.tsx',
        'src/components/FormField.tsx',
        'src/components/AssigneeWishlist.tsx',
        'src/App.tsx',
      ],
      thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
})
