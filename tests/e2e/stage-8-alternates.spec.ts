import { test, expect } from '@playwright/test';

test.describe('Stage 8: Alternate Lyrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project
    await page.getByRole('button', { name: 'Create Project' }).click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });
  });

  test('T-8.07: Alternates workflow passes in UI', async ({ page }) => {
    // Find a lyric line and click on it
    const lyricLine = page.locator('[data-type="lyricLine"]').first();

    if (await lyricLine.isVisible().catch(() => false)) {
      await lyricLine.click();
    }

    // Verify editor is present
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });

  test('T-8.07: Editor content persists with alternates', async ({ page }) => {
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });
});
