import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openProject, saveProject, isFileSystemAccessSupported, hasFileHandle } from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Unit coverage for HARDENING_PERSISTENCE.md §H4 (C-05): when the File System Access API
 * pickers don't exist (Firefox, Safari as of this writing), Open must fall back to a hidden
 * `input[type=file]` and Save must fall back to downloading a `.cyril` Blob — neither path
 * should ever throw.
 */
describe('File System Access API fallback (C-05 / HARDENING §H4)', () => {
  let originalShowOpenFilePicker: unknown;
  let originalShowSaveFilePicker: unknown;
  // `URL` is a process-global (not part of jsdom's per-file window), so these must be
  // restored explicitly — otherwise a mock left behind here could leak into other test
  // files sharing this worker.
  let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

  beforeEach(() => {
    const win = window as unknown as Record<string, unknown>;
    originalShowOpenFilePicker = win.showOpenFilePicker;
    originalShowSaveFilePicker = win.showSaveFilePicker;
    delete win.showOpenFilePicker;
    delete win.showSaveFilePicker;

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    const win = window as unknown as Record<string, unknown>;
    if (originalShowOpenFilePicker !== undefined) win.showOpenFilePicker = originalShowOpenFilePicker;
    else delete win.showOpenFilePicker;
    if (originalShowSaveFilePicker !== undefined) win.showSaveFilePicker = originalShowSaveFilePicker;
    else delete win.showSaveFilePicker;

    if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
    if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;

    vi.restoreAllMocks();
  });

  it('T-1.25: isFileSystemAccessSupported() is false once the pickers are undefined', () => {
    expect(isFileSystemAccessSupported()).toBe(false);
  });

  it('T-1.25: Open falls back to a hidden input[type=file] and reads the picked File; no throw', async () => {
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Fallback Song')));
    // A File-like object (jsdom's own `File` doesn't implement `.text()`) — `openProject`'s
    // fallback only needs `.text()`, which is all a real `File` guarantees in the browser.
    const fakeFile = { name: 'fallback.cyril', text: () => Promise.resolve(validJson) };

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (
      this: HTMLInputElement
    ) {
      Object.defineProperty(this, 'files', { value: [fakeFile], configurable: true });
      this.dispatchEvent(new Event('change'));
    });

    const file = await openProject();

    expect(file?.project.title).toBe('Fallback Song');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('T-1.25: Open resolves null (no throw) when the fallback input reports a cancel', async () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      this.dispatchEvent(new Event('cancel'));
    });

    await expect(openProject()).resolves.toBeNull();
  });

  it('T-1.25: Save falls back to downloading a Blob via a throwaway <a download> link; resolves true, no throw', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const file = createCyrilFile(createDefaultProject('Download Me'));
    const wrote = await saveProject(file, false);

    expect(wrote).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('T-1.25: the downloaded file name is derived from the project title', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    let downloadName = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });

    const file = createCyrilFile(createDefaultProject('My Great Song!'));
    await saveProject(file, false);

    expect(downloadName).toBe('my_great_song_.cyril');
  });

  it('T-1.25: autosave-to-disk stays impossible in fallback mode — hasFileHandle() never becomes true after a fallback save', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const file = createCyrilFile(createDefaultProject('No Handle Ever'));
    await saveProject(file, false);

    expect(hasFileHandle()).toBe(false);
  });

  it('T-1.25: Save As also falls back to a download (there is no in-place file to overwrite in this mode)', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const file = createCyrilFile(createDefaultProject('Save As Fallback'));
    const wrote = await saveProject(file, true);

    expect(wrote).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
  });
});
