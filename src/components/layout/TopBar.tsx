import * as React from 'react';
import { Download, FolderOpen, Save, MoreHorizontal, SaveAll, X, Import } from 'lucide-react';
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
  onSaveClick?: () => void;
  onImportShare?: () => void;
}

export function TopBar({ onExportClick, onSaveClick, onImportShare }: TopBarProps) {
  const projectTitle = useProjectStore((state) => state.currentProject?.project.title);
  const activeView = useProjectStore((state) => state.activeView);
  const drafts = useProjectStore((state) => state.currentProject?.project.drafts);
  const saveStatus = useSaveStatusStore((s) => s.status);
  const openProject = useProjectStore((s) => s.openProject);
  const saveProjectAs = useProjectStore((s) => s.saveProjectAs);
  const closeProject = useProjectStore((s) => s.closeProject);
  const isProjectLoaded = useProjectStore((s) => s.isProjectLoaded);

  const [overflowOpen, setOverflowOpen] = React.useState(false);
  const overflowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!overflowOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [overflowOpen]);

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

      {/* Right: file actions + export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Open — always available */}
        <button
          className="topbar-btn"
          onClick={() => openProject()}
          title="Open project"
          data-testid="topbar-open-btn"
        >
          <FolderOpen size={14} />
          Open
        </button>

        {/* Save — only when a project is loaded */}
        {isProjectLoaded && (
          <button
            className="topbar-btn"
            onClick={() => onSaveClick ? onSaveClick() : undefined}
            title="Save project (⌘S)"
            data-testid="topbar-save-btn"
          >
            <Save size={14} />
            Save
          </button>
        )}

        {/* Overflow ⋯ — only when a project is loaded */}
        {isProjectLoaded && (
          <div ref={overflowRef} style={{ position: 'relative' }}>
            <button
              className="topbar-btn topbar-overflow-trigger"
              onClick={() => setOverflowOpen((o) => !o)}
              title="More actions"
              aria-haspopup="menu"
              aria-expanded={overflowOpen}
              data-testid="topbar-overflow-btn"
            >
              <MoreHorizontal size={14} />
            </button>
            {overflowOpen && (
              <div className="topbar-overflow-menu" role="menu" data-testid="topbar-overflow-menu">
                <button
                  className="topbar-overflow-item"
                  role="menuitem"
                  onClick={() => { saveProjectAs(); setOverflowOpen(false); }}
                  data-testid="topbar-save-as-btn"
                >
                  <SaveAll size={13} />
                  Save As
                </button>
                {onImportShare && (
                  <button
                    className="topbar-overflow-item"
                    role="menuitem"
                    onClick={() => { onImportShare(); setOverflowOpen(false); }}
                    data-testid="import-share-button"
                  >
                    <Import size={13} />
                    Import Share
                  </button>
                )}
                <div className="topbar-overflow-divider" />
                <button
                  className="topbar-overflow-item topbar-overflow-item--danger"
                  role="menuitem"
                  onClick={() => { closeProject(); setOverflowOpen(false); }}
                  data-testid="topbar-close-btn"
                >
                  <X size={13} />
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        {/* Export */}
        <button
          onClick={onExportClick}
          className="topbar-btn topbar-btn--primary"
          data-testid="export-button"
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
}
