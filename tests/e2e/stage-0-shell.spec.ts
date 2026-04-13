import { test, expect } from '@playwright/test';

test.describe('Stage 0: App Shell', () => {
  test('T-0.07: App shell smoke test passes in browser', async ({ page }) => {
    await page.goto('/');

    // Verify empty state is shown initially
    await expect(page.getByText('Welcome to Cyril')).toBeVisible();
    await expect(page.getByText('Open an existing project or create a new one.')).toBeVisible();

    // The rest of the shell requires a project to be loaded, which we can simulate
    // by injecting state or we just verify the app booted successfully to the empty state.
    // For Stage 0, seeing the empty state without errors is sufficient for the e2e smoke test.
    await expect(page.getByRole('button', { name: 'Create Project' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Project' })).toBeVisible();
  });
});
