/**
 * T-15.10: The "write a song" journey.
 *
 * One long test through the real loop a writer actually takes, asserting an outcome
 * they would see at every step rather than that a click happened. Per-feature specs
 * pass every one of these steps in isolation; this test exists because D-02 and D-04
 * (see docs/engineering/DEFECTS.md) both lived in the *transitions* between features,
 * which no per-feature test ever crosses.
 *
 * Network is mocked for the Tools-pane search (step 8) so this test never depends on
 * Datamuse being reachable — see the `page.route` call below. The mocked response shape
 * matches `DatamuseItem` in `src/domain/tools/datamuse-provider.ts` (read from source,
 * not guessed): `{ word, score, numSyllables }`.
 */
import { test, expect, typeSlowly, focusEditor, writeSection, writeSpeaker, toggleView } from './fixtures';

const LYRIC_LINE_1 = 'Sing me a song for the morning';
const LYRIC_LINE_2 = 'Every word a little light';

test('T-15.10: write a song — section, speaker, lyrics, display toggles, tools, drafts, export all work together', async ({ page }) => {
  // Mocked Datamuse response for step 8 — fixed payload so the search result count and
  // content never depend on the real service being reachable or returning the same
  // words twice in a row.
  await page.route('**/api.datamuse.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { word: 'night', score: 300, numSyllables: 1 },
        { word: 'delight', score: 250, numSyllables: 2 },
        { word: 'twilight', score: 200, numSyllables: 2 },
      ]),
    }),
  );

  // ── 1. Launch screen: no app chrome, three text links present ──────────────────────
  await page.goto('/');
  await expect(page.getByTestId('launch-screen')).toBeVisible();
  await expect(page.locator('.top-bar')).toHaveCount(0);
  await expect(page.getByTestId('export-button')).toHaveCount(0);
  await expect(page.getByText('Create something', { exact: true })).toBeVisible();
  await expect(page.getByText('Improve something', { exact: true })).toBeVisible();
  await expect(page.getByText('Share a draft', { exact: true })).toBeVisible();

  await page.getByTestId('create-project-button').click();

  // ── 2. The editor shell appears ─────────────────────────────────────────────────────
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('.ProseMirror').first()).toBeVisible();

  // ── 3. `<<` -> section label input -> "Verse 1" -> Enter -> a section labelled VERSE 1
  await focusEditor(page);
  await writeSection(page, 'Verse 1');
  await expect(page.locator('.ProseMirror .section-label')).toHaveText('VERSE 1');

  // ── 4. `[[ANNA]]` -> a speaker line reading exactly ANNA, no trailing `]]` (D-04) ──
  // Scoped to the section's own content: inserting a section leaves the draft's
  // original (empty) lyric line as a sibling before/after it, which is real
  // document structure, not the thing under test here.
  await writeSpeaker(page, 'ANNA');
  const speakerLine = page.locator('.section-content .lyric-line[data-line-type="speaker"]').first();
  await expect(speakerLine).toHaveText('ANNA');
  await expect(speakerLine).not.toContainText(']]');

  // ── 5. Two lyric lines, both present ────────────────────────────────────────────────
  await typeSlowly(page, LYRIC_LINE_1);
  await page.keyboard.press('Enter');
  await typeSlowly(page, LYRIC_LINE_2);

  const lyricLines = page.locator('.section-content .lyric-line[data-line-type="lyric"]');
  await expect(lyricLines).toHaveCount(2);
  await expect(lyricLines.nth(0)).toHaveText(LYRIC_LINE_1);
  await expect(lyricLines.nth(1)).toHaveText(LYRIC_LINE_2);

  // ── 6. Syllables toggle -> a positive-integer badge per lyric line ─────────────────
  await toggleView(page, 'Syllables');
  const syllableBadges = page.getByTestId('syllable-count');
  await expect(syllableBadges).toHaveCount(2);
  for (const text of await syllableBadges.allTextContents()) {
    expect(text).toMatch(/^\d+$/);
    expect(Number(text)).toBeGreaterThan(0);
  }

  // ── 7. Stress marks toggle -> spans on lyric lines, none on the speaker line ───────
  await toggleView(page, 'Stress marks');
  const lyricStressMarks = page.locator('.lyric-line[data-line-type="lyric"] .cyril-stress-mark');
  await expect(lyricStressMarks.first()).toBeVisible();
  await expect(speakerLine.locator('.cyril-stress-mark')).toHaveCount(0);

  // ── 8. Search the Tools rail (network mocked above) -> at least one result ────────
  await page.getByTestId('tools-search-input').fill('night');
  await page.getByTestId('tools-search-button').click();
  const toolsResults = page.getByTestId('tools-result-item');
  await expect(toolsResults.first()).toBeVisible();
  await expect(toolsResults).toHaveCount(3);

  // ── 9. Collect a result -> it appears as an Inventory chip ────────────────────────
  await page.getByTestId('tools-result-item').first().click();
  const inventoryChip = page.getByTestId('inventory-chip');
  await expect(inventoryChip).toHaveCount(1);
  await expect(inventoryChip.first()).toContainText('night');

  // ── 10. Chords toggle -> the chord affordance appears in the toolbar ──────────────
  await toggleView(page, 'Chords');
  await expect(page.getByTestId('chord-add-button')).toBeVisible();

  // ── 11. Second draft is empty (no bleed); switching back restores draft 1 ─────────
  await page.getByText('+ New Draft', { exact: true }).click();
  await page.getByRole('button', { name: 'Create' }).click();

  // addDraft() switches the active view to the new draft immediately.
  const draftEditor = page.locator('.ProseMirror').first();
  await expect(draftEditor).toBeVisible();
  const draft2Text = (await draftEditor.innerText()).trim();
  expect(draft2Text).toBe('');
  await expect(page.locator('.lyric-line[data-line-type="speaker"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Draft 1' }).click();
  await expect(draftEditor).toContainText(LYRIC_LINE_1);
  await expect(draftEditor).toContainText(LYRIC_LINE_2);
  await expect(page.locator('.lyric-line[data-line-type="speaker"]').first()).toHaveText('ANNA');

  // ── 12. Export -> Print -> the preview HTML actually contains the lyric text (D-02) ─
  await page.getByTestId('export-button').click();
  await expect(page.getByTestId('export-dialog')).toBeVisible();
  await page.getByTestId('export-print-button').click();
  const previewFrameBody = page.frameLocator('[data-testid="print-preview-frame"]').locator('body');
  await expect(previewFrameBody).toContainText(LYRIC_LINE_1);
  await expect(previewFrameBody).toContainText(LYRIC_LINE_2);
});
