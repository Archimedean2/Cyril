import { test, expect } from './fixtures';

test.describe('Stage 11: Export and Print', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project so the app-shell (with TopBar export button) renders
    await page.getByTestId('create-project-button').click();
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

  test('T-11.14: Export dialog offers four named print profiles with a live preview, and the choice persists', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-button"]').first();
    await exportButton.click();

    const exportDialog = page.locator('[data-testid="export-dialog"]').first();
    await expect(exportDialog).toBeVisible();

    // Opening "Print / PDF" reveals the four named profiles.
    await exportDialog.locator('[data-testid="export-print-button"]').click();
    const panel = exportDialog.locator('[data-testid="print-profile-panel"]');
    await expect(panel).toBeVisible();

    const profileIds = ['lyricSheet', 'chordSheet', 'libretto', 'annotated'];
    for (const id of profileIds) {
      await expect(panel.locator(`[data-testid="print-profile-${id}"]`)).toBeVisible();
    }
    await expect(panel.locator('[data-testid="print-profile-lyricSheet"]')).toContainText('Lyric sheet');
    await expect(panel.locator('[data-testid="print-profile-chordSheet"]')).toContainText('Chord sheet');
    await expect(panel.locator('[data-testid="print-profile-libretto"]')).toContainText('Script / libretto');
    await expect(panel.locator('[data-testid="print-profile-annotated"]')).toContainText('Annotated');

    // The preview renders inside an iframe and reflects the selected profile.
    const previewFrame = panel.locator('[data-testid="print-preview-frame"]');
    await expect(previewFrame).toBeVisible();

    // Selecting the libretto profile marks it selected and updates the preview.
    await panel.locator('[data-testid="print-profile-libretto"]').click();
    await expect(panel.locator('[data-testid="print-profile-libretto"]')).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () =>
        page.frameLocator('[data-testid="print-preview-frame"]').locator('body').getAttribute('data-print-profile')
      )
      .toBe('libretto');

    // Close and reopen the dialog: the chosen profile persisted on the project.
    await exportDialog.locator('[data-testid="export-dialog-close"]').click();
    await expect(exportDialog).not.toBeVisible();

    await exportButton.click();
    await expect(exportDialog).toBeVisible();
    await exportDialog.locator('[data-testid="export-print-button"]').click();
    await expect(exportDialog.locator('[data-testid="print-profile-libretto"]')).toHaveAttribute('aria-pressed', 'true');

    await exportDialog.locator('[data-testid="export-dialog-close"]').click();
  });
});
