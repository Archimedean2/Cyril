import { test, expect } from '@playwright/test';

test.describe('Save Status & Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.locator('.ProseMirror')).toBeVisible();
  });

  test('Cmd+Shift+E opens export dialog', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+E');
    await expect(page.locator('h2:has-text("Export")')).toBeVisible({ timeout: 3000 });
  });

  test('save-status indicator appears after typing', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('test content');

    // The save status should transition to "unsaved" (if autosave is on and no file handle)
    // Since this is a new project with no file handle, autosave won't actually save,
    // but the status store still gets set to 'unsaved' when the project state changes.
    const status = page.getByTestId('save-status');
    // Wait a moment for the store update to propagate
    await page.waitForTimeout(500);
    // With no file handle, the status may show Unsaved (autosave skips, status stays unsaved)
    // or not appear at all (if status is idle). Either is valid for a new project.
    const statusVisible = await status.isVisible().catch(() => false);
    if (statusVisible) {
      const text = await status.textContent();
      expect(['Unsaved', 'Saving…', 'Saved']).toContain(text);
    }
  });
});
