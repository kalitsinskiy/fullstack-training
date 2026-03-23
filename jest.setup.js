// Add custom jest matchers from jest-dom
// This enables matchers like toBeInTheDocument(), toHaveTextContent(), etc.
// Only import if testing library is available (for React tests)
try {
  require('@testing-library/jest-dom');
} catch (e) {
  // jest-dom not needed for non-React tests
}

// Suppress console errors in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
