import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { readRecoverySnapshot, clearRecoverySnapshot } from '../../../src/persistence/indexeddb/recoveryStore';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H2 (C-04): the recovery snapshot must
 * be written on the same debounce as autosave, but *unconditionally* — regardless of file
 * handle or the `projectSettings.autosave` setting. This exercises the real autosave +
 * recoveryStore wiring together (fileManager itself is mocked, since disk I/O is not what
 * this criterion is about).
 */
vi.mock('../../../src/persistence/fileSystem/fileManager', () => ({
  hasFileHandle: vi.fn(() => false),
  saveProject: vi.fn(() => Promise.resolve()),
  openProject: vi.fn(),
  createNewProject: vi.fn(),
  duplicateProject: vi.fn(),
  tryReopenLastProject: vi.fn(() => Promise.resolve(null)),
}));

import { hasFileHandle } from '../../../src/persistence/fileSystem/fileManager';
import { startAutosave, stopAutosave, DEBOUNCE_MS } from '../../../src/persistence/autosave';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

function makeProject(title = 'Test') {
  return createCyrilFile(createDefaultProject(title));
}

describe('Recovery snapshot writes on the autosave debounce (T-1.22)', () => {
  beforeEach(async () => {
    // Clear with real timers first — fake-indexeddb's internal request scheduling relies
    // on real timer/microtask ticks that fake timers would stall (see write-permission.test.ts).
    await clearRecoverySnapshot();
    vi.useFakeTimers();
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      isInitializing: false,
      error: null,
      recoverySnapshot: null,
    });
  });

  afterEach(async () => {
    stopAutosave();
    vi.useRealTimers();
    vi.restoreAllMocks();
    await clearRecoverySnapshot();
  });

  it('T-1.22: editing with no file handle still writes a recovery snapshot', async () => {
    vi.mocked(hasFileHandle).mockReturnValue(false);
    const project = makeProject('No Handle Song');
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: { ...project, project: { ...project.project, updatedAt: new Date().toISOString() } },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();
    // Switch back to real timers before touching IndexedDB directly — fake-indexeddb's
    // internal request scheduling relies on real timer/microtask ticks.
    vi.useRealTimers();

    const snapshot = await readRecoverySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.file.project.title).toBe('No Handle Song');
  });

  it('T-1.22: editing with autosave disabled still writes a recovery snapshot', async () => {
    vi.mocked(hasFileHandle).mockReturnValue(false);
    const project = makeProject('Autosave Off Song');
    project.project.projectSettings.autosave = false;
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: { ...project, project: { ...project.project, updatedAt: new Date().toISOString() } },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();
    // Switch back to real timers before touching IndexedDB directly — fake-indexeddb's
    // internal request scheduling relies on real timer/microtask ticks.
    vi.useRealTimers();

    const snapshot = await readRecoverySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.file.project.title).toBe('Autosave Off Song');
  });

  it("a pending debounce reflects the live project at flush time, not a stale draft captured when scheduled (doesn't bleed between drafts)", async () => {
    vi.mocked(hasFileHandle).mockReturnValue(false);
    const project = makeProject('Multi Draft Song');
    // Add a second draft up front so both exist on the project.
    const secondDraftId = 'draft_second';
    project.project.drafts.push({
      ...project.project.drafts[0],
      id: secondDraftId,
      name: 'Draft 2',
      doc: { type: 'doc', content: [] },
    });
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    // Edit draft 1 — schedules the debounce.
    const firstDraftId = project.project.drafts[0].id;
    useProjectStore.getState().updateDraftDoc(firstDraftId, {
      type: 'doc',
      content: [{ type: 'lyricLine', attrs: { id: 'l1', delivery: 'sung', lineType: 'lyric', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'edited in draft 1' }] }],
    });

    // Before the debounce fires, "switch" to draft 2 and edit it too.
    useProjectStore.getState().setActiveView({ type: 'draft', draftId: secondDraftId });
    useProjectStore.getState().updateDraftDoc(secondDraftId, {
      type: 'doc',
      content: [{ type: 'lyricLine', attrs: { id: 'l2', delivery: 'sung', lineType: 'lyric', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'edited in draft 2' }] }],
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();
    // Switch back to real timers before touching IndexedDB directly — fake-indexeddb's
    // internal request scheduling relies on real timer/microtask ticks.
    vi.useRealTimers();

    const snapshot = await readRecoverySnapshot();
    expect(snapshot).not.toBeNull();

    const draft1 = snapshot!.file.project.drafts.find((d) => d.id === firstDraftId)!;
    const draft2 = snapshot!.file.project.drafts.find((d) => d.id === secondDraftId)!;

    // Both drafts' edits must be present — the snapshot is of the whole project as it
    // stood when the debounce fired, not a stale copy from when scheduling happened.
    expect((draft1.doc.content[0] as any).content[0].text).toBe('edited in draft 1');
    expect((draft2.doc.content[0] as any).content[0].text).toBe('edited in draft 2');
  });
});
