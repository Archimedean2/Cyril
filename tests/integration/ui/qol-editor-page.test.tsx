import { readFileSync } from 'fs';
import { resolve } from 'path';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

// C-12: the editor pane must read as a page — a measure-constrained, centred lyric
// column sitting on a distinctly-toned "desk", with a defined border/elevation edge
// and a deliberate gap below the toolbar. jsdom does not run layout or apply
// stylesheets, so pixel-level claims (measure, gap size) were verified visually
// (Playwright, 1440x900) rather than here. What IS real and checkable in this
// environment: the DOM nesting the design depends on, and that the CSS backing it
// exists, is token-driven, and has not silently regressed back to a flat rectangle.

const editorCssPath = resolve(__dirname, '../../../src/components/editor/editor.css');
const indexCssPath = resolve(__dirname, '../../../src/index.css');
const editorCss = readFileSync(editorCssPath, 'utf-8');
const indexCss = readFileSync(indexCssPath, 'utf-8');

describe('T-14.07: the editor page has a defined edge, a constrained measure, and a deliberate top gap', () => {
  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    useProjectStore.setState({
      isProjectLoaded: true,
      isInitializing: false,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: project.drafts[0].id },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.07: the draft editor nests a page (.ProseMirror) inside a desk (.editor-surface)', () => {
    render(<AppShell />);
    const surface = screen.getByTestId('editor-surface');
    expect(surface.className).toContain('editor-surface');
    const page = surface.querySelector('.ProseMirror');
    expect(page).not.toBeNull();
  });

  it('T-14.07: the page rule defines a real edge (border + soft elevation) using tokens, not hardcoded hex', () => {
    const pageRule = editorCss.match(/\.editor-surface \.ProseMirror \{[^}]*max-width: var\(--editor-page-max-width\)[^}]*\}/);
    expect(pageRule).not.toBeNull();
    const body = pageRule![0];

    // A defined edge: border + soft elevation, both token-driven.
    expect(body).toMatch(/border:\s*1px solid var\(--border-default\)/);
    expect(body).toMatch(/box-shadow:\s*var\(--shadow-soft\)/);
    // The page's own background is the paper tone, distinct from the desk it sits on.
    expect(body).toMatch(/background-color:\s*var\(--bg-editor\)/);
    // No hardcoded hex colour introduced for this surface.
    expect(body).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('T-14.07: the desk (.editor-surface) is toned distinctly from the page it holds', () => {
    // Anchored to line-start so this matches the bare ".editor-surface {" rule and
    // not ".editor-container > .editor-surface {", which also contains that substring.
    const deskRule = editorCss.match(/^\.editor-surface \{[^}]*\}/m);
    expect(deskRule).not.toBeNull();
    expect(deskRule![0]).toMatch(/background-color:\s*var\(--bg-app\)/);
  });

  it('T-14.07: the lyric column is constrained to a token-driven measure and centred, separately from the page width', () => {
    const measureRule = editorCss.match(/\.editor-surface \.ProseMirror > \*:not\(\.concurrent-block\) \{[^}]*\}/);
    expect(measureRule).not.toBeNull();
    const body = measureRule![0];
    expect(body).toMatch(/max-width:\s*var\(--editor-lyric-measure\)/);
    expect(body).toMatch(/margin-left:\s*auto/);
    expect(body).toMatch(/margin-right:\s*auto/);

    // The measure token must be a narrower value than the page's own outer width —
    // otherwise "constrained lyric column" and "full-bleed page" collapse into the
    // same box and concurrent blocks (which intentionally use the full page width)
    // would gain no extra room.
    const measureVar = indexCss.match(/--editor-lyric-measure:\s*(\d+)px/);
    const pageVar = indexCss.match(/--editor-page-max-width:\s*(\d+)px/);
    expect(measureVar).not.toBeNull();
    expect(pageVar).not.toBeNull();
    expect(Number(measureVar![1])).toBeLessThan(Number(pageVar![1]));
  });

  it('T-14.07: the top of the page sits a deliberate distance below the toolbar (desk gap + page padding, both token-driven)', () => {
    const pageRule = editorCss.match(/\.editor-surface \.ProseMirror \{[^}]*max-width: var\(--editor-page-max-width\)[^}]*\}/);
    expect(pageRule![0]).toMatch(/margin:\s*var\(--space-8\) 0/);
    expect(pageRule![0]).toMatch(/padding:\s*var\(--space-6\)/);

    // Regression guard for the bug this change surfaced: min-height must account for
    // the page's own vertical margin, or the box overflows its scroll container and
    // focusing the editor auto-scrolls the margin out of view, silently flattening
    // the gap the instant a writer starts typing.
    const minHeightRule = editorCss.match(/min-height:\s*calc\(100% - \(2 \* var\(--space-8\)\)\)/);
    expect(minHeightRule).not.toBeNull();
  });

  it('T-14.07: the faint grain overlay on the paper survives (still a data-URI SVG turbulence filter)', () => {
    const pageRule = editorCss.match(/\.editor-surface \.ProseMirror \{[^}]*max-width: var\(--editor-page-max-width\)[^}]*\}/);
    expect(pageRule![0]).toMatch(/feTurbulence/);
    expect(pageRule![0]).toMatch(/background-image:\s*url\("data:image\/svg\+xml/);
  });

  it('T-14.07: concurrent blocks still use the full page width, not the narrower lyric measure', () => {
    const concurrentRule = editorCss.match(/\.editor-surface \.ProseMirror > \.concurrent-block \{[^}]*\}/);
    expect(concurrentRule).not.toBeNull();
    expect(concurrentRule![0]).toMatch(/width:\s*100%/);
    expect(concurrentRule![0]).not.toMatch(/--editor-lyric-measure/);
  });
});
