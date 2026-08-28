import { useProjectStore } from '../../app/state/projectStore';

/**
 * Offers to restore a local recovery snapshot found at app init (HARDENING_PERSISTENCE.md
 * §H2 / C-04). Renders only while `recoverySnapshot` is set — i.e. app init found an
 * IndexedDB snapshot newer than whatever file was reopened (or nothing was opened at all).
 *
 * Deliberately minimal and modal: this is a data-loss-prevention prompt, not a feature
 * surface, so it blocks interaction with the rest of the shell until the user decides.
 */
export function RecoveryPrompt() {
  const recoverySnapshot = useProjectStore((s) => s.recoverySnapshot);
  const acceptRecovery = useProjectStore((s) => s.acceptRecovery);
  const declineRecovery = useProjectStore((s) => s.declineRecovery);

  if (!recoverySnapshot) return null;

  const title = recoverySnapshot.project.title || 'Untitled Song';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      data-testid="recovery-prompt"
    >
      <div
        style={{
          backgroundColor: 'var(--bg-editor, #fcfcfd)',
          borderRadius: '8px',
          border: '1px solid var(--border-default, #c8d0db)',
          width: '420px',
          maxWidth: '90vw',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(31, 36, 48, 0.06)',
        }}
      >
        <h2
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary, #1f2430)',
          }}
        >
          Recover unsaved work?
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary, #4a5565)',
            marginBottom: '16px',
          }}
        >
          Cyril found local changes to &quot;{title}&quot; that weren&apos;t saved to disk —
          from a browser tab that closed, crashed, or never had a file to save to.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={declineRecovery}
            data-testid="recovery-prompt-decline"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border-default, #c8d0db)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary, #1f2430)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Discard
          </button>
          <button
            onClick={acceptRecovery}
            data-testid="recovery-prompt-accept"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--accent-primary, #4f7db8)',
              backgroundColor: 'var(--accent-primary, #4f7db8)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}
