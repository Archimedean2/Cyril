import { Download } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import { useSaveStatusStore, SaveStatus } from '../../app/state/saveStatusStore';
import { CyrilMark } from '../brand/CyrilLogo';

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  unsaved: 'Unsaved',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

const STATUS_COLORS: Record<SaveStatus, string> = {
  idle: 'transparent',
  unsaved: 'var(--status-unsaved)',
  saving: 'var(--text-faint)',
  saved: 'var(--status-saved)',
  error: 'var(--status-error)',
};

interface TopBarProps {
  onExportClick: () => void;
}

export function TopBar({ onExportClick }: TopBarProps) {
  const projectTitle = useProjectStore((state) => state.currentProject?.project.title);
  const activeView = useProjectStore((state) => state.activeView);
  const drafts = useProjectStore((state) => state.currentProject?.project.drafts);
  const saveStatus = useSaveStatusStore((s) => s.status);

  const currentDraftName = activeView?.type === 'draft'
    ? drafts?.find(d => d.id === activeView.draftId)?.name
    : null;

  return (
    <div
      className="top-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 16px',
        fontSize: '14px',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Left: brand mark + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <CyrilMark size={24} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: '18px',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          Cyril
        </span>
      </div>

      {/* Center: Project title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-lyric)',
        fontSize: '15px',
        color: 'var(--text-primary)',
        fontWeight: 400,
      }}>
        <span>{projectTitle || 'Untitled'}</span>
        {currentDraftName && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
            <span
              data-testid="topbar-draft-name"
              style={{ color: 'var(--text-secondary)', fontSize: '13px' }}
            >
              {currentDraftName}
            </span>
          </>
        )}
        {saveStatus !== 'idle' && (
          <span
            data-testid="save-status"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: STATUS_COLORS[saveStatus],
              marginLeft: '4px',
            }}
          >
            {STATUS_LABELS[saveStatus]}
          </span>
        )}
      </div>

      {/* Right: Export button */}
      <button
        onClick={onExportClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-editor)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-editor)';
        }}
        data-testid="export-button"
      >
        <Download size={14} />
        Export
      </button>
    </div>
  );
}
