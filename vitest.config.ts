import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Vitest is used exclusively for unit-testing pure TypeScript systems in core/ and systems/.
// These modules import nothing from React or R3F, so we run in a plain 'node' environment —
// no DOM, no canvas, no WebGL — for maximum speed and isolation.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
    // Exclude E2E tests (Playwright) and browser-specific tests
    exclude: ['src/test/e2e/**', 'node_modules/**'],
    // M0: No test files yet — tests are added in M3–M5 alongside each system.
    // Remove this flag once the first real test file exists.
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
