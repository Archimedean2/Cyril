import { test, expect } from '@playwright/test';

test.describe('Speaker and Stage Direction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize and create a new project
    await page.waitForTimeout(500);
    await page.click('text=Create Project');
    await page.waitForTimeout(500);
    // Click on Draft 1 to open the draft view
    await page.click('text=Draft 1');
    await page.waitForTimeout(300);
  });

  test('T-4.07a: Clicking Speaker button converts line to speaker type', async ({ page }) => {
    // Focus the editor by clicking in it
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type some text
    await page.keyboard.type('WOODY');
    await page.waitForTimeout(200);

    // Click the Speaker button
    await page.click('[data-testid="toolbar-speaker"]');
    await page.waitForTimeout(200);

    // Verify the line is now a speaker line by checking the DOM
    const speakerLine = page.locator('[data-line-type="speaker"]');
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('WOODY');
  });

  test('T-4.07b: Clicking Speaker button again toggles back to lyric', async ({ page }) => {
    // Focus the editor and type
    await page.click('[data-testid="draft-editor"]');
    await page.keyboard.type('CHARACTER');
    await page.waitForTimeout(200);

    // Click Speaker button to make it a speaker line
    await page.click('[data-testid="toolbar-speaker"]');
    await page.waitForTimeout(200);

    // Verify it's a speaker line
    await expect(page.locator('[data-line-type="speaker"]')).toBeVisible();

    // Click Speaker button again to toggle back
    await page.click('[data-testid="toolbar-speaker"]');
    await page.waitForTimeout(200);

    // Verify it's back to a regular lyric line
    const lyricLine = page.locator('[data-line-type="lyric"]').first();
    await expect(lyricLine).toBeVisible();
    await expect(lyricLine).toContainText('CHARACTER');
  });

  test('T-4.08a: Clicking Stage Dir button converts line to stage direction', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type some text
    await page.keyboard.type('Sighs heavily');
    await page.waitForTimeout(200);

    // Click the Stage Dir button
    await page.click('[data-testid="toolbar-stage-dir"]');
    await page.waitForTimeout(200);

    // Verify the line is now a stage direction
    const stageDirLine = page.locator('[data-line-type="stageDirection"]');
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('Sighs heavily');
  });

  test('T-4.08b: Clicking Stage Dir button again toggles back to lyric', async ({ page }) => {
    // Focus the editor and type
    await page.click('[data-testid="draft-editor"]');
    await page.keyboard.type('(whispers)');
    await page.waitForTimeout(200);

    // Click Stage Dir button
    await page.click('[data-testid="toolbar-stage-dir"]');
    await page.waitForTimeout(200);

    // Verify it's a stage direction
    await expect(page.locator('[data-line-type="stageDirection"]')).toBeVisible();

    // Click again to toggle back
    await page.click('[data-testid="toolbar-stage-dir"]');
    await page.waitForTimeout(200);

    // Verify it's back to lyric
    const lyricLine = page.locator('[data-line-type="lyric"]').first();
    await expect(lyricLine).toBeVisible();
  });

  test('T-4.09a: Typing [[ at line start converts to speaker line', async ({ page }) => {
    // Focus the editor at the start of a line
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type [[ to trigger speaker conversion
    await page.keyboard.type('[[');
    await page.waitForTimeout(300);

    // Verify the line is now a speaker type
    const speakerLine = page.locator('[data-line-type="speaker"]').first();
    await expect(speakerLine).toBeVisible();
  });

  test('T-4.09b: Typing [[ then text creates speaker line with content', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type [[ followed by speaker name
    await page.keyboard.type('[[JESSE');
    await page.waitForTimeout(300);

    // Verify the line is a speaker line with the text
    const speakerLine = page.locator('[data-line-type="speaker"]');
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('JESSE');
  });

  test('T-4.10a: Typing (( at line start converts to stage direction', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type (( to trigger stage direction conversion
    await page.keyboard.type('((');
    await page.waitForTimeout(300);

    // Verify the line is now a stage direction type
    const stageDirLine = page.locator('[data-line-type="stageDirection"]').first();
    await expect(stageDirLine).toBeVisible();
  });

  test('T-4.10b: Typing (( then text creates stage direction with content', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type (( followed by stage direction text
    await page.keyboard.type('((Sighs and looks away');
    await page.waitForTimeout(300);

    // Verify the line is a stage direction with the text
    const stageDirLine = page.locator('[data-line-type="stageDirection"]');
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('Sighs and looks away');
  });

  test('T-4.11: Speaker and stage direction buttons are visible in toolbar', async ({ page }) => {
    // Verify both buttons are visible
    await expect(page.locator('[data-testid="toolbar-speaker"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-stage-dir"]')).toBeVisible();

    // Verify they have the correct labels
    await expect(page.locator('[data-testid="toolbar-speaker"]')).toContainText('Speaker');
    await expect(page.locator('[data-testid="toolbar-stage-dir"]')).toContainText('Stage Dir');
  });

  test('T-4.12: Multiple lines with different types in same document', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type first speaker line
    await page.keyboard.type('[[WOODY');
    await page.waitForTimeout(300);

    // Press Enter to create new line
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Type a lyric line
    await page.keyboard.type('You got a friend in me');
    await page.waitForTimeout(200);

    // Press Enter and add stage direction
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.type('((Woody smiles');
    await page.waitForTimeout(300);

    // Verify all three line types exist
    await expect(page.locator('[data-line-type="speaker"]')).toContainText('WOODY');
    await expect(page.locator('[data-line-type="lyric"]')).toContainText('You got a friend in me');
    await expect(page.locator('[data-line-type="stageDirection"]')).toContainText('Woody smiles');
  });

  test('T-4.13: Speaker line text is rendered in bold after typing [[', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type [[ followed by speaker name
    await page.keyboard.type('[[WOODY');
    await page.waitForTimeout(300);

    // Get the speaker line element
    const speakerLine = page.locator('[data-line-type="speaker"]').first();

    // Verify it contains the text
    await expect(speakerLine).toContainText('WOODY');

    // Verify it has bold styling (font-weight: 700 or bold)
    await expect(speakerLine).toHaveCSS('font-weight', '700');

    // Verify it's uppercase
    await expect(speakerLine).toHaveCSS('text-transform', 'uppercase');
  });

  test('T-4.14: Speaker line works outside of a section block', async ({ page }) => {
    // Focus the editor (at the start, there's no section by default)
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Verify we're not inside a section by checking no section-block exists
    const hasSection = await page.locator('.section-block').count() > 0;
    expect(hasSection).toBe(false);

    // Type [[ followed by speaker name (outside any section)
    await page.keyboard.type('[[BUZZ');
    await page.waitForTimeout(300);

    // Verify the line is now a speaker type
    const speakerLine = page.locator('[data-line-type="speaker"]');
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('BUZZ');
  });

  test('T-4.15: Stage direction works outside of a section block', async ({ page }) => {
    // Focus the editor
    await page.click('[data-testid="draft-editor"]');
    await page.waitForTimeout(200);

    // Type (( followed by stage direction (outside any section)
    await page.keyboard.type('((To infinity and beyond!');
    await page.waitForTimeout(300);

    // Verify the line is now a stage direction type
    const stageDirLine = page.locator('[data-line-type="stageDirection"]');
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('To infinity and beyond!');
  });
});
