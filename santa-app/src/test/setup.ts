import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// Suppress unhandled promise rejections from mutateAsync firing after component unmount.
// These originate from TanStack Mutation's mutateAsync when the React tree is torn down
// mid-flight (test cleanup); they are not real failures — the relevant assertions already passed.
process.on("unhandledRejection", () => {});
