import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * C-25 / DESIGN_PROPOSAL.md §4.5 — transposing from the toolbar, in a real browser.
 *
 * The rewriting rules are unit-tested and the document walk is integration-tested; what only
 * a browser can show is that the control is reachable in chord mode, that the rendered chord
 * pill actually changes, and that one Cmd+Z puts the whole song back.
 */
async function setUpChordedLine(page: Page, chordSymbol: string) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="create-project-button"]', { state: 'visible', timeout: 15000 });
  await page.click('[data-testid="create-project-button"]');
  await page.click('text=Draft 1');
  await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });

  await page.locator('[data-testid="toggle-show-chords"]').check();

  const editor = page.locator('[data-testid="editor-surface"] .ProseMirror');
  await editor.click();
  await page.keyboard.type('there is nothing left to lose', { delay: 20 });

  page.once('dialog', (d) => d.accept(chordSymbol));
  await page.click('[data-testid="chord-add-button"]');
  await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText(chordSymbol, { timeout: 5000 });
  return editor;
}

test.describe('Stage 9: transpose (C-25)', () => {
  test('E-9.24: the transpose controls appear only in chord mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="create-project-button"]', { state: 'visible', timeout: 15000 });
    await page.click('[data-testid="create-project-button"]');
    await page.click('text=Draft 1');
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });

    // Lyrics mode: transposing is meaningless, so the controls are not there at all.
    await expect(page.locator('[data-testid="chord-transpose-up"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chord-transpose-down"]')).toHaveCount(0);

    await page.locator('[data-testid="toggle-show-chords"]').check();
    await expect(page.locator('[data-testid="chord-transpose-up"]')).toBeVisible();
    await expect(page.locator('[data-testid="chord-transpose-down"]')).toBeVisible();
  });

  test('E-9.25: transposing up two semitones turns C into D on the page', async ({ page }) => {
    await setUpChordedLine(page, 'C');

    await page.click('[data-testid="chord-transpose-up"]');
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('C#');

    await page.click('[data-testid="chord-transpose-up"]');
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('D');
  });

  test('E-9.26: transposing down works and one undo puts the song back', async ({ page }) => {
    const editor = await setUpChordedLine(page, 'Am7');

    await page.click('[data-testid="chord-transpose-down"]');
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('G#m7');

    // The quality survived the move, which is the thing a naive rewrite breaks.
    await expect(page.locator('[data-testid="chord-marker"]').first()).not.toContainText('G#m75');

    await editor.click();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Am7');

    // …and the lyric itself is untouched by the undo — the transpose was its own step.
    await expect(editor).toContainText('there is nothing left to lose');
  });
});
