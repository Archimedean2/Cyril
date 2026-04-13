import { test, expect } from '@playwright/test';

test.describe('Stage 1: Project CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-1.11: Project CRUD smoke flow passes in UI', async ({ page }) => {
    // 1. App should start at empty state
    await expect(page.getByText('Welcome to Cyril')).toBeVisible();

    // 2. Create new project
    await page.getByRole('button', { name: 'Create Project' }).click();

    // 3. Left nav should display default title
    await expect(page.getByText('Untitled Song')).toBeVisible();

    // Rename project
    await page.getByTestId('project-title').click();
    const input = page.getByTestId('project-title-input');
    await input.fill('My Great Song');
    await input.press('Enter');

    // Title should be updated
    await expect(page.getByTestId('project-title')).toHaveText('My Great Song');

    // 5. Close project to return to empty state
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('Welcome to Cyril')).toBeVisible();

    // We can't fully end-to-end test the File System Access API due to 
    // browser security restrictions in automated headless environments,
    // so we verify the state management and UI interactions work up to that boundary.
  });
});
