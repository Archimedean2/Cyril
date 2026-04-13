import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  retries: process.env.CI ? 2 : 0, // Don't retry locally to fail faster
  workers: process.env.CI ? 1 : undefined, // Parallel tests locally
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'on-first-retry', // Only record traces when retrying
    actionTimeout: 10000, // Fail faster on actions
  },
  expect: {
    timeout: 5000, // Shorter expect timeout
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30000, // Fail faster if dev server doesn't start
  },
});
