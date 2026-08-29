import * as React from 'react';
import { Download, FolderOpen, Save, MoreHorizontal, SaveAll, X, Import, Expand, Shrink } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import { useSaveStatusStore, SaveStatus } from '../../app/state/saveStatusStore';
import { CyrilMark } from '../brand/CyrilLogo';

// C-06 / HARDENING §H7: 'local-only' means the project is durably snapshotted in this
// browser's IndexedDB (HARDENING §H2 / C-04) but no file on disk reflects it — a plain
// dot or "Unsaved" would either look broken (no dot at all once the debounce settles) or
// understate what actually happened (the work *is* safe here, just not on disk). Spell
// that out so a writer without an engineering model of the app can act on it correctly.
const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  unsaved: 'Unsaved',
  saving: 'Saving…',
  saved: 'Saved',
  'local-only': 'Saved in browser — not on disk yet',
  error: 'Save failed',
};

const STATUS_COLORS: Record<SaveStatus, string> = {
  idle: 'transparent',
  unsaved: 'var(--status-unsaved)',
  saving: 'var(--text-faint)',
  saved: 'var(--status-saved)',
  'local-only': 'var(--status-unsaved)',
  error: 'var(--status-error)',
};

interface TopBarProps {
  onExportClick: () => void;
  onSaveClick?: () => void;
  onImportShare?: () => void;
  focusModeActive?: boolean;
  onToggleFocusMode?: () => void;
}

export function TopBar({ onExportClick, onSaveClick, onImportShare, focusModeActive, onToggleFocusMode }: TopBarProps) {
  const projectTitle = useProjectStore((state) => state.currentProject?.project.title);
  const activeView = useProjectStore((state) => state.activeView);
  const drafts = useProjectStore((state) => state.currentProject?.project.drafts);
  const saveStatus = useSaveStatusStore((s) => s.status);
  const openProject = useProjectStore((s) => s.openProject);
  const saveProjectAs = useProjectStore((s) => s.saveProjectAs);
  const closeProject = useProjectStore((s) => s.closeProject);
  const isProjectLoaded = useProjectStore((s) => s.isProjectLoaded);
  const renameProject = useProjectStore((s) => s.renameProject);
  const renameDraft = useProjectStore((s) => s.renameDraft);

  const [overflowOpen, setOverflowOpen] = React.useState(false);
  const overflowRef = React.useRef<HTMLDivElement>(null);

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [isEditingDraft, setIsEditingDraft] = React.useState(false);
  const [editDraftName, setEditDraftName] = React.useState('');

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

      {/* Center: Project title — click to edit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-lyric)',
        fontSize: '15px',
        color: 'var(--text-primary)',
        fontWeight: 400,
      }}>
        {isProjectLoaded && isEditingTitle ? (
          <input
            autoFocus
            data-testid="topbar-title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              if (editTitle.trim() && editTitle !== projectTitle) renameProject(editTitle.trim());
              setIsEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editTitle.trim() && editTitle !== projectTitle) renameProject(editTitle.trim());
                setIsEditingTitle(false);
              }
              if (e.key === 'Escape') setIsEditingTitle(false);
            }}
            style={{ fontSize: '15px', fontFamily: 'var(--font-lyric)', padding: '2px 6px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-editor)', color: 'var(--text-primary)', outline: 'none' }}
          />
        ) : (
          <span
            data-testid="topbar-project-title"
            onClick={isProjectLoaded ? () => { setEditTitle(projectTitle || ''); setIsEditingTitle(true); } : undefined}
            title={isProjectLoaded ? 'Click to rename' : undefined}
            style={{ cursor: isProjectLoaded ? 'pointer' : undefined }}
          >
            {projectTitle || 'Untitled'}
          </span>
        )}
        {currentDraftName && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
            {isEditingDraft ? (
              <input
                autoFocus
                data-testid="topbar-draft-name-input"
                value={editDraftName}
                onChange={(e) => setEditDraftName(e.target.value)}
                onBlur={() => {
                  const draftId = activeView?.type === 'draft' ? activeView.draftId : null;
                  if (draftId && editDraftName.trim() && editDraftName !== currentDraftName) renameDraft(draftId, editDraftName.trim());
                  setIsEditingDraft(false);
                }}
                onKeyDown={(e) => {
                  const draftId = activeView?.type === 'draft' ? activeView.draftId : null;
                  if (e.key === 'Enter') {
                    if (draftId && editDraftName.trim() && editDraftName !== currentDraftName) renameDraft(draftId, editDraftName.trim());
                    setIsEditingDraft(false);
                  }
                  if (e.key === 'Escape') setIsEditingDraft(false);
                }}
                style={{ fontSize: '13px', fontFamily: 'var(--font-lyric)', padding: '2px 6px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-editor)', color: 'var(--text-secondary)', outline: 'none' }}
              />
            ) : (
              <span
                data-testid="topbar-draft-name"
                onClick={() => { setEditDraftName(currentDraftName); setIsEditingDraft(true); }}
                title="Click to rename"
                style={{ color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}
              >
                {currentDraftName}
              </span>
            )}
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

        {/* Export */}
        <button
          onClick={onExportClick}
          className="topbar-btn topbar-btn--primary"
          data-testid="export-button"
        >
          <Download size={14} />
          Export
        </button>

        {/* Focus mode toggle — always visible when a project is loaded */}
        {isProjectLoaded && onToggleFocusMode && (
          <button
            className={`topbar-btn topbar-btn--icon${focusModeActive ? ' topbar-btn--active' : ''}`}
            onClick={onToggleFocusMode}
            title={focusModeActive ? 'Exit focus mode (⌘\\)' : 'Focus mode (⌘\\)'}
            data-testid="focus-mode-btn"
            aria-pressed={focusModeActive}
          >
            {focusModeActive ? <Shrink size={14} /> : <Expand size={14} />}
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
                  onClick={() => {
                    // saveProjectAs() can now reject (HARDENING §H6 / C-07 propagates real
                    // save failures) — the project store already records `error` state, so
                    // this fire-and-forget call just needs to not become an unhandled
                    // rejection.
                    saveProjectAs().catch(() => {});
                    setOverflowOpen(false);
                  }}
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
      </div>
    </div>
  );
}
