import { test, expect } from '@playwright/test';

test.describe('Stage 2: Editor Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-2.10: Editor smoke flow passes in UI', async ({ page }) => {
    // 1. Create a project to see the editor
    await page.getByRole('button', { name: 'Create Project' }).click();

    // 2. Editor should be visible
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();

    // 3. Type some text
    await editor.click();
    await editor.fill('Hello from Playwright.');
    
    await expect(editor).toContainText('Hello from Playwright.');

    // 4. Try bolding text
    // Select all text (Ctrl+A / Cmd+A)
    await editor.press('Control+A');
    
    // Click the Bold button in the toolbar
    const boldButton = page.getByRole('button', { name: 'B', exact: true });
    await boldButton.click();

    // The text should now be wrapped in a strong tag
    const strongTag = editor.locator('strong');
    await expect(strongTag).toBeVisible();
    await expect(strongTag).toContainText('Hello from Playwright.');
  });
});
