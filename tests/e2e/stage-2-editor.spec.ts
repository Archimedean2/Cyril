import { test, expect } from './fixtures';

test.describe('Stage 2: Editor Foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-2.10: Editor smoke flow passes in UI', async ({ page }) => {
    // 1. Create a project to see the editor
    await page.getByTestId('create-project-button').click();

    // 2. Editor should be visible
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();

    // 3. Type some text
    await editor.click();
    await page.keyboard.type('Hello from Playwright.');

    await expect(editor).toContainText('Hello from Playwright.');

    // 4. Try bolding text — select all and click Bold.
    // ControlOrMeta, not Meta: select-all here is the browser's own binding, so
    // on Linux CI it is Ctrl+A. Meta is the Super key there and selects nothing.
    await page.keyboard.press('ControlOrMeta+A');
    await page.getByTestId('editor-bold-button').click();

    // The text should now be wrapped in a strong tag
    const strongTag = editor.locator('strong');
    await expect(strongTag).toBeVisible();
    await expect(strongTag).toContainText('Hello from Playwright.');
  });
});
