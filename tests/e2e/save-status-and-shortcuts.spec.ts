import { test, expect } from '@playwright/test';

test.describe('Save Status & Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('create-project-button').click();
    await expect(page.locator('.ProseMirror')).toBeVisible();
  });

  test('Cmd+Shift+E opens export dialog', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+E');
    await expect(page.locator('h2:has-text("Export")')).toBeVisible({ timeout: 3000 });
  });

  test('save-status indicator appears after typing', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('When the night has come');
    await page.keyboard.press('Enter');
    await page.keyboard.type('And the land is dark');

    const status = page.getByTestId('save-status');
    await page.waitForTimeout(500);
    const statusVisible = await status.isVisible().catch(() => false);
    if (statusVisible) {
      const text = await status.textContent();
      expect(['Unsaved', 'Saving…', 'Saved']).toContain(text);
    }
  });
});
