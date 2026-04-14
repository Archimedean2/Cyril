import { test, expect } from '@playwright/test';

test.describe('Stage 5: Inventory Pane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project first
    await page.click('text=Create Project');
  });

  test('T-5.06: Inventory workflow passes in UI', async ({ page }) => {
    // Switch to Draft
    await page.click('text=Draft 1');

    // Wait for the inventory pane to be visible
    await expect(page.locator('[data-testid="inventory-pane"]')).toBeVisible();
    
    // Check that the inventory textarea is visible
    const inventoryTextarea = page.locator('[data-testid="inventory-textarea"]');
    await expect(inventoryTextarea).toBeVisible();

    // Type some inventory content
    await inventoryTextarea.fill('Spare line 1\nSpare line 2\nRhyme: time, rhyme, sublime');

    // Verify the content is in the textarea
    await expect(inventoryTextarea).toHaveValue('Spare line 1\nSpare line 2\nRhyme: time, rhyme, sublime');

    // The inventory content should persist (simulate by checking it's still there after a short delay)
    await page.waitForTimeout(100);
    await expect(inventoryTextarea).toHaveValue('Spare line 1\nSpare line 2\nRhyme: time, rhyme, sublime');
  });
});
