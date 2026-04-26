import { test, expect } from '@playwright/test';

test.describe('Stage 4: Sections and Metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project first
    await page.click('text=Create Project');
  });

  test('T-4.10: Section/metadata workflow passes in UI', async ({ page }) => {
    // Switch to Draft
    await page.click('text=Draft 1');

    // Wait for the draft editor to be visible
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();

    // Verify the display toggles are visible in the left sidebar
    await expect(page.locator('text=View')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-show-sections"]')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-show-speakers"]')).toBeVisible();

    // Try to insert a section
    await page.click('[data-testid="editor-add-section-button"]');
    
    // Check that section is added by inspecting the editor surface
    await expect(page.locator('[data-type="sectionBlock"]')).toBeVisible();

    // Type some text then toggle it to a speaker line
    await page.locator('[data-testid="editor-surface"] .ProseMirror').click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('WOODY');
    await page.click('[data-testid="toolbar-speaker"]');
    await expect(page.locator('[data-line-type="speaker"]')).toBeAttached();

    // Type some text then toggle it to a stage direction
    await page.keyboard.press('Enter');
    await page.keyboard.type('Sighs heavily');
    await page.click('[data-testid="toolbar-stage-dir"]');
    await expect(page.locator('[data-line-type="stageDirection"]')).toBeAttached();

    // Toggle display settings
    const sectionToggle = page.locator('[data-testid="toggle-show-sections"]');
    await sectionToggle.uncheck();
    await expect(sectionToggle).not.toBeChecked();

    const speakerToggle = page.locator('[data-testid="toggle-show-speakers"]');
    await speakerToggle.uncheck();
    await expect(speakerToggle).not.toBeChecked();
  });
});

test.describe('Stage 4: << Section Input Rule', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Project');
    await page.click('text=Draft 1');
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });

  test('T-4.16: Typing << at start of a line inserts a section block', async ({ page }) => {
    const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await proseMirror.click();
    await page.keyboard.type('<<');
    await page.waitForTimeout(300);

    await expect(page.locator('[data-type="sectionBlock"]')).toBeVisible();
  });

  test('T-4.17: Section inserted by << has a section label in the DOM', async ({ page }) => {
    const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await proseMirror.click();
    await page.keyboard.type('<<');
    await page.waitForTimeout(300);

    await expect(page.locator('[data-type="sectionBlock"] .section-label')).toBeVisible();
  });

  test('T-4.18: Cursor lands inside the new section after << so typing immediately works', async ({ page }) => {
    const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await proseMirror.click();
    await page.keyboard.type('<<');
    await page.waitForTimeout(300);

    // Type text immediately after << fires — it should appear inside the new section
    await page.keyboard.type('verse content');
    await page.waitForTimeout(200);

    const sectionContent = page.locator('[data-type="sectionBlock"]');
    await expect(sectionContent).toContainText('verse content');
  });

  test('T-4.19: Typing << inside an existing section creates a new section after it', async ({ page }) => {
    const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await proseMirror.click();

    // First insert a section via toolbar
    await page.click('[data-testid="editor-add-section-button"]');
    await page.waitForTimeout(300);

    // Focus editor again and type << to insert a second section
    await proseMirror.click();
    await page.keyboard.type('<<');
    await page.waitForTimeout(300);

    // Two section blocks should now exist
    const sections = page.locator('[data-type="sectionBlock"]');
    await expect(sections).toHaveCount(2);
  });

  test('T-4.20: << does not fire mid-line (only at start of empty line)', async ({ page }) => {
    const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await proseMirror.click();

    // Type some text first, then <<
    await page.keyboard.type('some text <<');
    await page.waitForTimeout(300);

    // No section should have been created — << mid-line is plain text
    await expect(page.locator('[data-type="sectionBlock"]')).toHaveCount(0);
    await expect(proseMirror).toContainText('some text <<');
  });
});
