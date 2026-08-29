import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

describe('Metadata Commands', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(getDraftEditorConfig());
  });

  afterEach(() => {
    editor.destroy();
  });

  test('T-4.04: Toggle speaker line preserves text', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'lyricLine',
          attrs: { id: 'line-s', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'WOODY' }]
        }
      ]
    });
    editor.commands.focus();
    editor.commands.setLineType('speaker');

    const json = editor.getJSON();
    expect(json.content?.length).toBeGreaterThanOrEqual(1);
    expect(json.content?.[0].type).toBe('lyricLine');
    expect(json.content?.[0].attrs?.lineType).toBe('speaker');
    expect((json.content?.[0].content?.[0] as any)?.text).toBe('WOODY');
  });

  test('T-4.05: Toggle stage direction preserves text', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'lyricLine',
          attrs: { id: 'line-d', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'Sighs heavily' }]
        }
      ]
    });
    editor.commands.focus();
    editor.commands.setLineType('stageDirection');

    const json = editor.getJSON();
    expect(json.content?.length).toBeGreaterThanOrEqual(1);
    expect(json.content?.[0].type).toBe('lyricLine');
    expect(json.content?.[0].attrs?.lineType).toBe('stageDirection');
    expect((json.content?.[0].content?.[0] as any)?.text).toBe('Sighs heavily');
  });

  // T-4.06 ("Spoken/sung state persists on lyric line") covered the now-removed
  // `delivery` feature (C-10: cut per DESIGN_PROPOSAL.md §3.4) and no longer
  // applies — the `toggleDelivery` command and `delivery` attribute are gone.
  // See tests/unit/editor/delivery-removed.test.ts (T-4.26) and
  // tests/unit/domain/migration.test.ts (T-4.27).
});
