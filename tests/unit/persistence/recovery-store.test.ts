import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import {
  writeRecoverySnapshot,
  readRecoverySnapshot,
  clearRecoverySnapshot,
} from '../../../src/persistence/indexeddb/recoveryStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

describe('Recovery snapshot store (HARDENING §H2 / C-04)', () => {
  afterEach(async () => {
    await clearRecoverySnapshot();
  });

  it('T-1.22: writing a snapshot with no file handle involved persists it, and it can be read back', async () => {
    const file = createCyrilFile(createDefaultProject('Never Saved Song'));

    expect(await readRecoverySnapshot()).toBeNull();

    await expect(writeRecoverySnapshot(file)).resolves.toBe(true);

    const snapshot = await readRecoverySnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot!.file.project.title).toBe('Never Saved Song');
    expect(snapshot!.file.project.id).toBe(file.project.id);
    expect(typeof snapshot!.savedAt).toBe('string');
    expect(() => new Date(snapshot!.savedAt).toISOString()).not.toThrow();
  });

  it('T-1.22: writing a snapshot restores it exactly (deep equality) — no lossy round-trip', async () => {
    const project = createDefaultProject('Exact Restore Song');
    project.drafts[0].doc.content.push({
      type: 'lyricLine',
      attrs: { id: 'line_extra', delivery: 'sung', lineType: 'lyric', rhymeGroup: 'A', meta: { alternates: [], prosody: null, chords: [] } },
      content: [{ type: 'text', text: 'a brand new line' }],
    });
    const file = createCyrilFile(project);

    await writeRecoverySnapshot(file);
    const snapshot = await readRecoverySnapshot();

    expect(snapshot!.file).toEqual(file);
  });

  it('a later write overwrites the previous snapshot (single-slot store)', async () => {
    const first = createCyrilFile(createDefaultProject('First'));
    const second = createCyrilFile(createDefaultProject('Second'));

    await writeRecoverySnapshot(first);
    await writeRecoverySnapshot(second);

    const snapshot = await readRecoverySnapshot();
    expect(snapshot!.file.project.title).toBe('Second');
  });

  it('clearRecoverySnapshot removes it', async () => {
    const file = createCyrilFile(createDefaultProject('To Be Cleared'));
    await writeRecoverySnapshot(file);
    expect(await readRecoverySnapshot()).not.toBeNull();

    await clearRecoverySnapshot();

    expect(await readRecoverySnapshot()).toBeNull();
  });

  it('degrades gracefully (no throw) when IndexedDB.open fails, e.g. quota exceeded/private browsing', async () => {
    const realOpen = indexedDB.open;
    // Simulate IndexedDB being unusable, matching EDGE_CASES.md §8: "IndexedDB
    // unavailable/quota-exceeded (private browsing) must degrade gracefully, no crash."
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const file = createCyrilFile(createDefaultProject('Quota Test'));
      // C-06: callers use the return value to decide whether to report the work as
      // durably snapshotted, so a degraded write must resolve `false`, not silently
      // succeed-looking `undefined`.
      await expect(writeRecoverySnapshot(file)).resolves.toBe(false);
      await expect(readRecoverySnapshot()).resolves.toBeNull();
    } finally {
      (indexedDB as unknown as { open: unknown }).open = realOpen;
    }
  });
});
