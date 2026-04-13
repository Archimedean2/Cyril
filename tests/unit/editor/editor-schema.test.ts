import { describe, it, expect } from 'vitest';
import { getBaseEditorConfig } from '../../../src/editor/core/baseConfig';

describe('Editor Schema (T-2.01)', () => {
  it('T-2.01: Base editor schema supports paragraph and text nodes', () => {
    const config = getBaseEditorConfig();
    const extensions = config.extensions || [];
    
    // StarterKit bundles paragraph and text nodes
    const hasStarterKit = extensions.some(ext => ext.name === 'starterKit');
    expect(hasStarterKit).toBe(true);

    // Ensure we disabled unsupported block types
    const starterKitConfig = extensions.find(ext => ext.name === 'starterKit')?.options;
    expect(starterKitConfig?.heading).toBe(false);
    expect(starterKitConfig?.codeBlock).toBe(false);
    expect(starterKitConfig?.blockquote).toBe(false);
  });
});
