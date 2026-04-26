/**
 * Plugin State Reactivity — browser tests
 *
 * These tests specifically exercise the transaction-meta update path that was
 * the root cause of both the chord and syllable features not working:
 *
 *   ChordExtension / SyllableExtension used stale closures for draftMode /
 *   showChords / showSyllableCounts. The fix stores these values in ProseMirror
 *   plugin state (init/apply) and DraftEditor pushes fresh values via
 *   tr.setMeta(...) whenever the relevant React props change.
 *
 * Each test confirms that the *decoration layer* (DOM output of the plugin)
 * responds correctly to setting changes made after the editor has already
 * mounted — not just that CSS classes change on a wrapper div.
 */

import { test, expect, Page } from '@playwright/test';

async function setup(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
  await page.click('text=Create Project');
  await page.click('text=Draft 1');
  await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });
}

async function typeInEditor(page: Page, text: string) {
  const pm = page.locator('[data-testid="editor-surface"] .ProseMirror');
  await pm.waitFor({ state: 'visible' });
  await pm.click();
  await page.keyboard.type(text);
}

async function addChord(page: Page, symbol: string) {
  await expect(async () => {
    expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
  }).toPass({ timeout: 5000 });
  const dialogPromise = page.waitForEvent('dialog', { timeout: 8000 });
  await page.click('[data-testid="chord-add-button"]');
  const dialog = await dialogPromise;
  await dialog.accept(symbol);
}

// ─── Chord plugin state reactivity ───────────────────────────────────────────

test.describe('Chord plugin state reactivity', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('PR-C.01: Chord decoration absent in Lyrics mode even after typing', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    // Default mode is lyrics — plugin state should suppress all decorations
    await expect(page.locator('[data-testid="chord-lane"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0);
  });

  test('PR-C.02: Switching to Lyrics+Chords mode enables the chord decoration layer', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    // No markers before mode switch
    await expect(page.locator('[data-testid="chord-lane"]')).toHaveCount(0);

    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    // After adding a chord the lane should appear (decoration layer is now live)
    await addChord(page, 'G');
    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('G');
  });

  test('PR-C.03: Switching back to Lyrics mode removes chord decorations from DOM', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await typeInEditor(page, 'Amazing grace');
    await addChord(page, 'Am');
    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // The critical path: plugin state must update when mode prop changes
    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-testid="chord-lane"]')).toHaveCount(0);
  });

  test('PR-C.04: Unchecking showChords removes lane widget from DOM (not just hidden via CSS)', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await typeInEditor(page, 'Amazing grace');
    await addChord(page, 'D');
    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });

    // Plugin must stop generating decorations; the lane widget should not be in the DOM
    await page.locator('[data-testid="toggle-show-chords"]').uncheck();
    await expect(page.locator('[data-testid="chord-lane"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('PR-C.05: Re-checking showChords re-creates lane widgets in DOM', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await typeInEditor(page, 'Amazing grace');
    await addChord(page, 'Em');
    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="toggle-show-chords"]').uncheck();
    await expect(page.locator('[data-testid="chord-lane"]')).toHaveCount(0, { timeout: 5000 });

    // Plugin must re-emit decorations when flag flips back
    await page.locator('[data-testid="toggle-show-chords"]').check();
    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Em');
  });

  test('PR-C.06: Chord decoration layer still works after document edits in chord mode', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await typeInEditor(page, 'Amazing grace');
    await addChord(page, 'C');
    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Edit the document — decorations must rebuild without errors
    const pm = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await pm.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' how sweet');

    // Lane and marker must survive the document update
    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('C');
  });
});

// ─── Syllable plugin state reactivity ────────────────────────────────────────

test.describe('Syllable plugin state reactivity', () => {
  test.beforeEach(async ({ page }) => { await setup(page); });

  test('PR-S.01: Syllable badges absent when showSyllableCounts is off (default)', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace how sweet the sound');
    // Plugin state default is showSyllableCounts=false — no decoration widgets
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0);
  });

  test('PR-S.02: Enabling syllable toggle causes plugin to emit badge widgets', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0);

    // Plugin state update via tr.setMeta(syllablePluginKey, ...) must fire
    await page.locator('[data-testid="toggle-show-syllables"]').check();
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });
  });

  test('PR-S.03: Badge widget contains a positive integer for non-empty lyric text', async ({ page }) => {
    await typeInEditor(page, 'Hello world');
    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    const text = await badge.textContent();
    expect(Number(text)).toBeGreaterThan(0);
  });

  test('PR-S.04: Disabling syllable toggle causes plugin to remove badge widgets from DOM', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    await page.locator('[data-testid="toggle-show-syllables"]').check();
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });

    // Plugin must stop emitting decorations when flag is turned off
    await page.locator('[data-testid="toggle-show-syllables"]').uncheck();
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('PR-S.05: Badge count updates reactively as text is added to the line', async ({ page }) => {
    await typeInEditor(page, 'Hi');
    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    const before = Number(await badge.textContent());

    // More text → decoration must rebuild with higher count
    const pm = page.locator('[data-testid="editor-surface"] .ProseMirror');
    await pm.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' there beautiful wonderful friend');

    await expect(async () => {
      const after = Number(await badge.textContent());
      expect(after).toBeGreaterThan(before);
    }).toPass({ timeout: 5000 });
  });

  test('PR-S.06: Each lyric line gets its own independent badge widget', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    await page.keyboard.press('Enter');
    await page.keyboard.type('How sweet the sound');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(2, { timeout: 5000 });
  });

  test('PR-S.07: Syllable plugin is independent of chord mode — works in Lyrics mode', async ({ page }) => {
    // No mode switch — remains in default Lyrics mode
    await typeInEditor(page, 'Amazing grace');
    await page.locator('[data-testid="toggle-show-syllables"]').check();
    // Badge must appear regardless of draftMode
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });
  });

  test('PR-S.08: Syllable badges still present after switching to Lyrics+Chords mode and back', async ({ page }) => {
    await typeInEditor(page, 'Amazing grace');
    await page.locator('[data-testid="toggle-show-syllables"]').check();
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });

    // Mode round-trip must not destroy syllable plugin state
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await page.click('[data-testid="draft-mode-option-lyrics"]');

    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });
  });
});
