import { test, expect } from './fixtures';

test.describe('Stage 1: Project CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-1.11: Project CRUD smoke flow passes in UI', async ({ page }) => {
    // 1. App should start at launch screen
    await expect(page.getByTestId('launch-screen')).toBeVisible();

    // 2. Create new project
    await page.getByTestId('create-project-button').click();

    // 3. Top bar should display default title (the song title's single home — T-14.05/06)
    await expect(page.getByTestId('topbar-project-title')).toHaveText('Untitled Song');

    // Rename project
    await page.getByTestId('topbar-project-title').click();
    const input = page.getByTestId('topbar-title-input');
    await input.fill('My Great Song');
    await input.press('Enter');

    // Title should be updated
    await expect(page.getByTestId('topbar-project-title')).toHaveText('My Great Song');

    // 5. Close project to return to empty state (Close is in the overflow ⋯ menu)
    await page.getByTestId('topbar-overflow-btn').click();
    await page.getByTestId('topbar-close-btn').click();
    await expect(page.getByTestId('launch-screen')).toBeVisible();
  });
});
