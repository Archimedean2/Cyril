import { test, expect } from '@playwright/test';

test.describe('Stage 9: Chord Lane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const projectList = page.locator('[data-testid="project-list"]');
    if (await projectList.count() === 0 || await projectList.locator('li').count() === 0) {
      await page.click('text=Create New Project');
      await page.fill('[data-testid="project-title-input"]', 'Chord Test Project');
      await page.click('[data-testid="create-project-button"]');
    }

    await page.click('[data-testid="project-list"] li:first-child');
    await page.click('text=Draft');
  });

  test('E-9.01: Chord workflow passes in UI', async ({ page }) => {
    // Verify draft editor is visible
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();

    // Step 1: Switch draft mode to Lyrics + Chords
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');

    // Step 2: Verify or enable showChords
    const showChordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(showChordsToggle).toBeVisible();
    if (!(await showChordsToggle.isChecked())) {
      await showChordsToggle.click();
    }
    await expect(showChordsToggle).toBeChecked();

    // Step 3: Focus draft editor and place caret in a lyric line
    const editorSurface = page.locator('[data-testid="editor-surface"]');
    await expect(editorSurface).toBeVisible();

    const lyricLine = editorSurface.locator('[data-type="lyricLine"]').first();
    if (await lyricLine.count() > 0) {
      await lyricLine.click();
    }

    // Step 4: Add a chord — stub the prompt dialog
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Am');
      } else if (dialog.type() === 'confirm') {
        await dialog.accept();
      }
    });

    await page.click('[data-testid="chord-add-button"]');

    // Step 5: Assert chord marker appears
    const chordMarker = page.locator('[data-testid="chord-marker"]').first();
    await expect(chordMarker).toBeVisible({ timeout: 3000 });
    await expect(chordMarker).toHaveText('Am');

    // Step 6: Toggle showChords off — marker should hide
    await showChordsToggle.click();
    await expect(showChordsToggle).not.toBeChecked();
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0);

    // Step 7: Toggle showChords back on — marker reappears
    await showChordsToggle.click();
    await expect(showChordsToggle).toBeChecked();
    await expect(page.locator('[data-testid="chord-marker"]').first()).toBeVisible();

    // Step 8: Switch mode back to Lyrics — chord markers should disappear
    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0);

    // Step 9: Switch mode back to Lyrics + Chords — chord data should survive
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await expect(page.locator('[data-testid="chord-marker"]').first()).toBeVisible();
  });
});
