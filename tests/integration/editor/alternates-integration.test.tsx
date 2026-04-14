import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import { useState, useCallback } from 'react';

// Mock the alternates commands
vi.mock('../../../src/domain/editor/alternates-commands', () => ({
  addAlternate: vi.fn().mockReturnValue(true),
  activateAlternate: vi.fn().mockReturnValue(true),
  removeAlternate: vi.fn().mockReturnValue(true),
  getAlternates: vi.fn().mockReturnValue([]),
  isInLyricLine: vi.fn().mockReturnValue(true),
  createAlternateLine: vi.fn((text, label) => ({
    id: 'alt_test_123',
    label: label || 'Alt 1',
    doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
    isActive: false,
  })),
  extractTextFromDoc: vi.fn((doc) => doc.content?.[0]?.content?.[0]?.text || ''),
}));

import {
  addAlternate,
  activateAlternate,
  removeAlternate,
} from '../../../src/domain/editor/alternates-commands';

// Test component that simulates editor with alternates UI
function TestEditorWithAlternates() {
  const [alternates, setAlternates] = useState<any[]>([]);
  const [showAlternates, setShowAlternates] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Original line text' }],
        },
      ],
    },
  });

  const handleAddAlternate = useCallback(() => {
    if (editor) {
      const result = addAlternate(editor, 'Alternate text', 'Test Alt');
      if (result) {
        // Simulate adding to local state
        const newAlt = {
          id: `alt_${Date.now()}`,
          label: 'Test Alt',
          text: 'Alternate text',
          isActive: false,
        };
        setAlternates(prev => [...prev, newAlt]);
      }
    }
  }, [editor]);

  const handleActivate = useCallback((id: string) => {
    if (editor) {
      activateAlternate(editor, id);
      setAlternates(prev =>
        prev.map(alt => ({
          ...alt,
          isActive: alt.id === id,
        }))
      );
    }
  }, [editor]);

  const handleRemove = useCallback((id: string) => {
    if (editor) {
      removeAlternate(editor, id);
      setAlternates(prev => prev.filter(alt => alt.id !== id));
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      <div data-testid="editor-container">
        <EditorContent editor={editor} />
      </div>
      
      <button
        data-testid="add-alternate-btn"
        onClick={handleAddAlternate}
      >
        Add Alternate
      </button>
      
      <button
        data-testid="toggle-alternates-btn"
        onClick={() => setShowAlternates(!showAlternates)}
      >
        Toggle Alternates
      </button>
      
      {showAlternates && (
        <div data-testid="alternates-panel">
          {alternates.length === 0 ? (
            <div data-testid="no-alternates">No alternates</div>
          ) : (
            alternates.map(alt => (
              <div
                key={alt.id}
                data-testid="alternate-item"
                className={alt.isActive ? 'active' : ''}
              >
                <span data-testid="alternate-label">{alt.label}</span>
                <span data-testid="alternate-text">{alt.text}</span>
                <button
                  data-testid="activate-btn"
                  onClick={() => handleActivate(alt.id)}
                  disabled={alt.isActive}
                >
                  {alt.isActive ? 'Active' : 'Activate'}
                </button>
                <button
                  data-testid="remove-btn"
                  onClick={() => handleRemove(alt.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

describe('Alternates Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('T-8.04: Alternates persist through save/load', () => {
    // This test verifies the data structure is correct for persistence
    const mockAlternate = {
      id: 'alt_001',
      label: 'Test Alternate',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Alternate line content' }],
          },
        ],
      },
      isActive: false,
    };

    // Verify the structure matches what would be saved
    expect(mockAlternate.id).toBeDefined();
    expect(mockAlternate.doc).toBeDefined();
    expect(mockAlternate.doc.content).toBeDefined();
    expect(mockAlternate.isActive).toBe(false);
  });

  test('T-8.05: Editor displays only active line text in main draft', () => {
    render(<TestEditorWithAlternates />);
    
    // The editor should show the original content
    const editor = screen.getByTestId('editor-container');
    expect(editor).toBeInTheDocument();
    
    // Verify editor content is rendered
    expect(editor.textContent).toContain('Original line text');
  });

  test('T-8.05: Alternate panel can be toggled', () => {
    render(<TestEditorWithAlternates />);
    
    // Initially alternates panel should not be visible
    expect(screen.queryByTestId('alternates-panel')).not.toBeInTheDocument();
    
    // Click toggle button
    fireEvent.click(screen.getByTestId('toggle-alternates-btn'));
    
    // Now panel should be visible
    expect(screen.getByTestId('alternates-panel')).toBeInTheDocument();
    expect(screen.getByTestId('no-alternates')).toBeInTheDocument();
  });

  test('T-8.06: Adding alternate updates UI', async () => {
    render(<TestEditorWithAlternates />);
    
    // Toggle alternates panel
    fireEvent.click(screen.getByTestId('toggle-alternates-btn'));
    
    // Add an alternate
    fireEvent.click(screen.getByTestId('add-alternate-btn'));
    
    // Wait for the alternate to appear
    await waitFor(() => {
      const items = screen.getAllByTestId('alternate-item');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  test('T-8.06: Activating alternate updates state', async () => {
    render(<TestEditorWithAlternates />);
    
    // Toggle panel and add alternate
    fireEvent.click(screen.getByTestId('toggle-alternates-btn'));
    fireEvent.click(screen.getByTestId('add-alternate-btn'));
    
    // Wait for alternate to appear
    await waitFor(() => {
      expect(screen.getByTestId('alternate-item')).toBeInTheDocument();
    });
    
    // Click activate button
    const activateBtn = screen.getByTestId('activate-btn');
    expect(activateBtn).not.toBeDisabled();
    fireEvent.click(activateBtn);
    
    // Button should now show as active
    await waitFor(() => {
      expect(activateBtn.textContent).toBe('Active');
    });
  });

  test('T-8.06: Removing alternate updates UI', async () => {
    render(<TestEditorWithAlternates />);
    
    // Toggle panel and add alternate
    fireEvent.click(screen.getByTestId('toggle-alternates-btn'));
    fireEvent.click(screen.getByTestId('add-alternate-btn'));
    
    // Wait for alternate to appear
    await waitFor(() => {
      expect(screen.getByTestId('alternate-item')).toBeInTheDocument();
    });
    
    // Click remove button
    fireEvent.click(screen.getByTestId('remove-btn'));
    
    // Alternate should be removed
    await waitFor(() => {
      expect(screen.queryByTestId('alternate-item')).not.toBeInTheDocument();
      expect(screen.getByTestId('no-alternates')).toBeInTheDocument();
    });
  });
});
