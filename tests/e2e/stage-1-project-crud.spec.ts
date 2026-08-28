import { test, expect } from '@playwright/test';

test.describe('Stage 1: Project CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-1.11: Project CRUD smoke flow passes in UI', async ({ page }) => {
    // 1. App should start at launch screen
    await expect(page.getByTestId('launch-screen')).toBeVisible();

    // 2. Create new project
    await page.getByTestId('create-project-button').click();

    // 3. Left nav should display default title
    await expect(page.getByTestId('project-title')).toHaveText('Untitled Song');

    // Rename project
    await page.getByTestId('project-title').click();
    const input = page.getByTestId('project-title-input');
    await input.fill('My Great Song');
    await input.press('Enter');

    // Title should be updated
    await expect(page.getByTestId('project-title')).toHaveText('My Great Song');

    // 5. Close project to return to empty state (Close is in the overflow ⋯ menu)
    await page.getByTestId('topbar-overflow-btn').click();
    await page.getByTestId('topbar-close-btn').click();
    await expect(page.getByTestId('launch-screen')).toBeVisible();
  });
});
