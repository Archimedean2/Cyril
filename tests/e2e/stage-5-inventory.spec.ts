import { test, expect } from '@playwright/test';

test.describe('Stage 5: Inventory Pane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project first
    await page.click('[data-testid="create-project-button"]');
  });

  test('T-5.06: Inventory workflow passes in UI', async ({ page }) => {
    // Switch to Draft
    await page.click('text=Draft 1');

    // Wait for the inventory pane to be visible
    await expect(page.locator('[data-testid="inventory-pane"]')).toBeVisible();

    // No native textarea / resize grabber (C-11)
    await expect(page.locator('[data-testid="inventory-textarea"]')).toHaveCount(0);

    // Starts with an inviting empty state
    await expect(page.locator('[data-testid="inventory-empty-state"]')).toBeVisible();

    // Add items via the chip input
    const addInput = page.locator('[data-testid="inventory-add-input"]');
    const addButton = page.locator('[data-testid="inventory-add-button"]');

    for (const line of ['Spare line 1', 'Spare line 2', 'Rhyme: time, rhyme, sublime']) {
      await addInput.fill(line);
      await addButton.click();
    }

    // Each line renders as its own chip
    await expect(page.locator('[data-testid="inventory-chip"]')).toHaveCount(3);
    await expect(page.getByText('Spare line 1')).toBeVisible();
    await expect(page.getByText('Spare line 2')).toBeVisible();
    await expect(page.getByText('Rhyme: time, rhyme, sublime')).toBeVisible();

    // The content should persist (still there after a short delay)
    await page.waitForTimeout(100);
    await expect(page.locator('[data-testid="inventory-chip"]')).toHaveCount(3);

    // Removing a chip persists the removal
    await page.locator('[data-testid="inventory-chip-remove"]').first().click();
    await expect(page.locator('[data-testid="inventory-chip"]')).toHaveCount(2);
    await expect(page.getByText('Spare line 1')).not.toBeVisible();
  });
});
