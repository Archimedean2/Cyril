import { describe, it, expect, vi, afterEach } from 'vitest';
import { useSaveStatusStore } from '../../../src/app/state/saveStatusStore';
import {
  startBeforeUnloadGuard,
  stopBeforeUnloadGuard,
  isBeforeUnloadGuardActive,
} from '../../../src/persistence/beforeUnloadGuard';

describe('beforeunload guard (C-03)', () => {
  afterEach(() => {
    stopBeforeUnloadGuard();
    useSaveStatusStore.setState({ status: 'idle' });
    vi.restoreAllMocks();
  });

  it('T-1.24: dirty state registers the beforeunload guard and sets returnValue; clean state removes it', () => {
    useSaveStatusStore.setState({ status: 'idle' });
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    startBeforeUnloadGuard();

    // Clean at start — no guard registered yet.
    expect(isBeforeUnloadGuardActive()).toBe(false);
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));

    // Going dirty ('unsaved') registers the guard.
    useSaveStatusStore.getState().setStatus('unsaved');
    expect(isBeforeUnloadGuardActive()).toBe(true);
    const registerCall = addSpy.mock.calls.find(([type]) => type === 'beforeunload');
    expect(registerCall).toBeDefined();
    const handler = registerCall![1] as (e: Event & { returnValue?: unknown }) => void;

    // The registered handler prevents default and sets returnValue (both are
    // required, across browsers, to actually surface the "leave site?" prompt).
    const fakeEvent = { preventDefault: vi.fn(), returnValue: undefined as unknown } as unknown as Event & {
      returnValue?: unknown;
    };
    handler(fakeEvent);
    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(fakeEvent.returnValue).toBeTruthy();

    // Failing to save ('error') is also dirty — guard stays registered.
    useSaveStatusStore.getState().setStatus('error');
    expect(isBeforeUnloadGuardActive()).toBe(true);

    // Going clean ('saved') removes the guard.
    useSaveStatusStore.getState().setStatus('saved');
    expect(isBeforeUnloadGuardActive()).toBe(false);
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', handler);
  });

  it('T-1.24: idle and saving statuses are not treated as dirty', () => {
    useSaveStatusStore.setState({ status: 'idle' });
    startBeforeUnloadGuard();

    useSaveStatusStore.getState().setStatus('saving');
    expect(isBeforeUnloadGuardActive()).toBe(false);

    useSaveStatusStore.getState().setStatus('idle');
    expect(isBeforeUnloadGuardActive()).toBe(false);
  });

  it('T-1.24: stopBeforeUnloadGuard tears the listener down even while dirty', () => {
    useSaveStatusStore.setState({ status: 'unsaved' });
    startBeforeUnloadGuard();
    expect(isBeforeUnloadGuardActive()).toBe(true);

    stopBeforeUnloadGuard();
    expect(isBeforeUnloadGuardActive()).toBe(false);

    // Further status changes after stop must not re-register anything.
    useSaveStatusStore.getState().setStatus('error');
    expect(isBeforeUnloadGuardActive()).toBe(false);
  });
});
