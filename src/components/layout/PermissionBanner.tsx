import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import './PermissionBanner.css';

/**
 * BACKLOG C-29: C-02's `tryReopenLastProject` correctly *keeps* a stored file handle when
 * reading it fails with `NotAllowedError` (permission lost, not gone/corrupt) rather than
 * discarding it — but until now nothing in the UI let the writer act on that; their only
 * route back to their own file was `Open` and the picker again.
 *
 * This is an inline, non-blocking banner (not a modal) that sits above the editor: clicking
 * "Reconnect" calls `requestPermission` from that click (a user gesture is required) and, on
 * success, resumes normal saving to the same file with no re-picking. Declining — either the
 * native permission prompt, or dismissing this banner outright — leaves the project fully
 * usable; the save status stays honest regardless (it never depended on this banner).
 */
export function PermissionBanner() {
  const fileName = useProjectStore((s) => s.permissionLockedFileName);
  const regrantPermission = useProjectStore((s) => s.regrantPermission);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // A new (or different) permission-lock event should show the banner again even if a
  // previous one was dismissed.
  const lastFileNameRef = React.useRef(fileName);
  if (fileName !== lastFileNameRef.current) {
    lastFileNameRef.current = fileName;
    if (dismissed) setDismissed(false);
  }

  if (!fileName || dismissed) return null;

  const handleReconnect = async () => {
    setIsRequesting(true);
    try {
      await regrantPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="permission-banner" role="status" data-testid="permission-banner">
      <AlertTriangle size={14} className="permission-banner-icon" aria-hidden="true" />
      <span className="permission-banner-text">
        Cyril lost permission to save to &ldquo;{fileName}&rdquo;. Reconnect it to resume saving to disk —
        your work is still safe in this browser either way.
      </span>
      <div className="permission-banner-actions">
        <button
          className="permission-banner-btn permission-banner-btn--primary"
          onClick={handleReconnect}
          disabled={isRequesting}
          data-testid="permission-banner-reconnect"
        >
          {isRequesting ? 'Reconnecting…' : 'Reconnect'}
        </button>
        <button
          className="permission-banner-btn"
          onClick={() => setDismissed(true)}
          data-testid="permission-banner-dismiss"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
