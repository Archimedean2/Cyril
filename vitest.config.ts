import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // NOTE: the default multi-process `forks` pool hangs on exit because a
    // worker leaks an open handle (an undestroyed Tiptap editor / fake-indexeddb
    // connection keeps the process alive). `singleFork` runs the whole suite in
    // one child process, which tears down cleanly and is also the fastest option
    // here (jsdom is set up once). See NEXT_STEPS.md for the follow-up to find and
    // fix the underlying leak so parallelism can be restored.
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/**/*.d.ts',
      ],
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
