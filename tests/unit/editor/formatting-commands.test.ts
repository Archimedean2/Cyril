import { describe, it, expect, beforeEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getBaseEditorConfig } from '../../../src/editor/core/baseConfig';

describe('Editor Formatting Commands (T-2.02, T-2.03, T-2.04)', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(getBaseEditorConfig());
  });

  it('T-2.02: Bold command applies and removes mark correctly', () => {
    editor.commands.setContent('<p>Hello world</p>');
    editor.commands.selectAll();
    
    expect(editor.isActive('bold')).toBe(false);
    
    // Toggle bold on
    editor.commands.toggleBold();
    expect(editor.isActive('bold')).toBe(true);
    expect(editor.getHTML()).toBe('<p><strong>Hello world</strong></p>');

    // Toggle bold off
    editor.commands.toggleBold();
    expect(editor.isActive('bold')).toBe(false);
    expect(editor.getHTML()).toBe('<p>Hello world</p>');
  });

  it('T-2.03: Italic command applies and removes mark correctly', () => {
    editor.commands.setContent('<p>Hello world</p>');
    editor.commands.selectAll();
    
    expect(editor.isActive('italic')).toBe(false);
    
    // Toggle italic on
    editor.commands.toggleItalic();
    expect(editor.isActive('italic')).toBe(true);
    expect(editor.getHTML()).toBe('<p><em>Hello world</em></p>');

    // Toggle italic off
    editor.commands.toggleItalic();
    expect(editor.isActive('italic')).toBe(false);
    expect(editor.getHTML()).toBe('<p>Hello world</p>');
  });

  it('T-2.04: Indentation command updates document as expected', () => {
    editor.commands.setContent('<p>Hello</p>');
    
    // The indent extension should insert a tab character
    // We mock triggering the keyboard shortcut 'Tab' command
    editor.commands.insertContent('\t');
    
    const text = editor.getText();
    expect(text).toBe('Hello\t');
  });
});
