/// <reference types="vitest/config" />
import path from "node:path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.spec.{ts,tsx}",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/test/**",
        // Vendored shadcn/ui primitives — library code, not app logic.
        "src/components/ui/**",
        // Dead code, superseded by services/api.ts + FormField is unused.
        "src/hooks/useApi.ts",
        "src/components/FormField.tsx",
      ],
      thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
});
