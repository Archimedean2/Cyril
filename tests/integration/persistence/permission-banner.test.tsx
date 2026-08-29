import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermissionBanner } from '../../../src/components/layout/PermissionBanner';
import { useProjectStore } from '../../../src/app/state/projectStore';

/**
 * Component coverage for BACKLOG C-29: the inline, non-blocking banner (not a modal) that
 * offers to re-grant a lost file permission. Verifies it only renders when there's
 * something to reconnect, that "Reconnect" calls `regrantPermission` from its own click (a
 * user gesture — required for `requestPermission`), and that declining ("Not now") leaves
 * the rest of the app usable rather than blocking anything.
 */
describe('PermissionBanner (C-29)', () => {
  beforeEach(() => {
    useProjectStore.setState({ permissionLockedFileName: null });
  });

  it('T-1.31: renders nothing when there is no permission lock', () => {
    render(<PermissionBanner />);
    expect(screen.queryByTestId('permission-banner')).toBeNull();
  });

  it("T-1.31: renders the file name and a Reconnect affordance when the banner's flag is set", () => {
    useProjectStore.setState({ permissionLockedFileName: 'my-song.cyril' });
    render(<PermissionBanner />);

    const banner = screen.getByTestId('permission-banner');
    expect(banner.textContent).toContain('my-song.cyril');
    expect(screen.getByTestId('permission-banner-reconnect')).toBeInTheDocument();
  });

  it('T-1.31: clicking Reconnect calls regrantPermission (a user gesture) and clears the banner on success', async () => {
    const regrantPermission = vi.fn().mockImplementation(async () => {
      useProjectStore.setState({ permissionLockedFileName: null });
    });
    useProjectStore.setState({ permissionLockedFileName: 'my-song.cyril', regrantPermission });
    render(<PermissionBanner />);

    fireEvent.click(screen.getByTestId('permission-banner-reconnect'));

    expect(regrantPermission).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByTestId('permission-banner')).toBeNull());
  });

  it('T-1.31: clicking "Not now" dismisses the banner without touching regrantPermission, leaving the app usable', () => {
    const regrantPermission = vi.fn();
    useProjectStore.setState({ permissionLockedFileName: 'my-song.cyril', regrantPermission });
    render(<PermissionBanner />);

    fireEvent.click(screen.getByTestId('permission-banner-dismiss'));

    expect(screen.queryByTestId('permission-banner')).toBeNull();
    expect(regrantPermission).not.toHaveBeenCalled();
    // Declining is purely a UI dismissal — the store's lock flag is untouched, so a
    // fresh mount (e.g. navigating back) would still see it if still relevant.
    expect(useProjectStore.getState().permissionLockedFileName).toBe('my-song.cyril');
  });
});
