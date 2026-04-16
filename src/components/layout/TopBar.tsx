import { Download } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';

interface TopBarProps {
  onExportClick: () => void;
}

export function TopBar({ onExportClick }: TopBarProps) {
  const projectTitle = useProjectStore((state) => state.currentProject?.project.title);
  const activeView = useProjectStore((state) => state.activeView);
  const drafts = useProjectStore((state) => state.currentProject?.project.drafts);

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
        fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Left: App name */}
      <div style={{ 
        fontWeight: 600, 
        color: 'var(--text-secondary, #4a5565)',
        fontSize: '13px',
        letterSpacing: '0.02em',
      }}>
        Cyril
      </div>

      {/* Center: Project title */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-primary, #1f2430)',
        fontWeight: 500,
      }}>
        <span>{projectTitle || 'Untitled'}</span>
        {currentDraftName && (
          <>
            <span style={{ color: 'var(--text-muted, #738093)' }}>—</span>
            <span style={{ color: 'var(--text-secondary, #4a5565)', fontSize: '13px' }}>
              {currentDraftName}
            </span>
          </>
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
          borderRadius: '6px',
          border: '1px solid var(--border-default, #c8d0db)',
          backgroundColor: 'var(--bg-editor, #fcfcfd)',
          color: 'var(--text-secondary, #4a5565)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 0.1s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover, #e8edf3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-editor, #fcfcfd)';
        }}
        data-testid="export-button"
      >
        <Download size={14} />
        Export
      </button>
    </div>
  );
}
