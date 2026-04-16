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
          attrs: { id: 'line-s', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
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
          attrs: { id: 'line-d', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
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

  test('T-4.06: Spoken/sung state persists on lyric line', () => {
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'lyricLine',
          attrs: { id: 'line-1', delivery: 'sung', rhymeGroup: null, meta: JSON.stringify({ alternates: [], prosody: null, chords: [] }) },
          content: [{ type: 'text', text: 'Hello' }]
        }
      ]
    });

    // Select the lyric line
    editor.commands.selectAll();
    
    // Toggle delivery
    const result = editor.commands.toggleDelivery();
    expect(result).toBe(true);

    const json = editor.getJSON();
    expect(json.content?.[0].type).toBe('lyricLine');
    expect(json.content?.[0].attrs?.delivery).toBe('spoken');
  });
});
