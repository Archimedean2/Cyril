import { test, expect } from './fixtures';

test.describe('Stage 0: App Shell', () => {
  test('T-0.07: App shell smoke test passes in browser', async ({ page }) => {
    await page.goto('/');

    // T-0.07 / T-0.08: With no project open, the launch screen renders without the top bar
    await expect(page.getByTestId('launch-screen')).toBeVisible();
    await expect(page.locator('.app-shell-topbar')).not.toBeVisible();

    // T-0.09: The stacked logo sits top-left
    await expect(page.getByTestId('launch-logo')).toBeVisible();
    await expect(page.getByText('Cyril')).toBeVisible();

    // T-0.10: The three actions are text-link buttons wired to create/open/share
    await expect(page.getByTestId('create-project-button')).toBeVisible();
    await expect(page.getByTestId('create-project-button')).toHaveText('Create something');
    await expect(page.getByText('Improve something')).toBeVisible();
    await expect(page.getByTestId('import-share-button')).toBeVisible();
    await expect(page.getByTestId('import-share-button')).toHaveText('Share a draft');

    // T-0.11: The pull-quote panel renders on the right with oversized quotation marks
    await expect(page.getByTestId('launch-quote-panel')).toBeVisible();

    // T-0.12: No filled button exists on the screen
    const filledButtons = page.locator('.primary-button, .secondary-button');
    await expect(filledButtons).toHaveCount(0);
  });
});
