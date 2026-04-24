import { test, expect } from '@playwright/test';

test.describe('Stage 11: Export and Print', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // The app auto-creates a project on load; wait for the shell to appear
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
  });

  test('T-11.07: Export workflow passes in UI', async ({ page }) => {
    // Look for export button in TopBar
    const exportButton = page.locator('[data-testid="export-button"]').first();
    await expect(exportButton).toBeVisible();

    // Click export button to open dialog
    await exportButton.click();

    // Wait for export dialog
    const exportDialog = page.locator('[data-testid="export-dialog"]').first();
    await expect(exportDialog).toBeVisible();

    // Verify markdown option exists
    const markdownOption = exportDialog.locator('[data-testid="export-markdown-button"]').first();
    await expect(markdownOption).toBeVisible();

    // Verify print option exists
    const printOption = exportDialog.locator('[data-testid="export-print-button"]').first();
    await expect(printOption).toBeVisible();

    // Close dialog
    const closeButton = exportDialog.locator('[data-testid="export-dialog-close"]').first();
    await closeButton.click();

    // Dialog should close
    await expect(exportDialog).not.toBeVisible();
  });
});
