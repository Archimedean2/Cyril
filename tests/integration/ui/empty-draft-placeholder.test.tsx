import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

describe('T-15.03: empty draft shows placeholder text', () => {
  let editor: Editor;
  let el: HTMLDivElement;

  afterEach(() => {
    editor.destroy();
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  it('first lyricLine has data-placeholder when doc is empty', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const emptyDoc = {
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'line_empty', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
        content: [],
      }],
    };

    editor = new Editor({
      ...getDraftEditorConfig({ content: emptyDoc }),
      element: el,
    });

    const firstLine = el.querySelector('[data-type="lyricLine"]');
    expect(firstLine).not.toBeNull();
    expect(firstLine?.getAttribute('data-placeholder')).toBe('Start writing…');
    expect(firstLine?.classList.contains('is-empty')).toBe(true);
  });

  it('placeholder is absent when the doc has content', () => {
    el = document.createElement('div');
    document.body.appendChild(el);

    const filledDoc = {
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'line_filled', delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
        content: [{ type: 'text', text: 'Amazing grace' }],
      }],
    };

    editor = new Editor({
      ...getDraftEditorConfig({ content: filledDoc }),
      element: el,
    });

    const firstLine = el.querySelector('[data-type="lyricLine"]');
    expect(firstLine?.classList.contains('is-empty')).toBe(false);
  });
});
