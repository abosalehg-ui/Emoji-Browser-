import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The bulk of this codebase touches the DOM, localStorage, or both; a bare
    // node environment could only ever reach the handful of pure helpers.
    environment: 'jsdom',
    include: ['test/**/*.test.js'],
  },
});
