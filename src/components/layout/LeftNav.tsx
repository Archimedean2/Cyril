import * as React from 'react';
import { FolderOpen, Save, SaveAll, Copy, X } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import { WorkspaceNav } from '../../features/workspace-nav/WorkspaceNav';
import { DraftList } from '../../features/draft-manager/DraftList';
import { DisplayControls } from '../../features/display-controls/DisplayControls';

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  titleInput: {
    width: '100%',
    padding: '4px 8px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-editor)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-1)',
    flexWrap: 'wrap',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xs)',
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    height: '24px',
  },
  actionButtonDanger: {
    color: 'var(--status-unsaved)',
    borderColor: 'var(--border-subtle)',
  },
};

export function LeftNav() {
  const { currentProject, renameProject, saveProject, saveProjectAs, duplicateProject, closeProject, openProject } = useProjectStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');

  const title = currentProject?.project.title || 'Untitled Song';

  const handleTitleClick = () => {
    setEditTitle(title);
    setIsEditing(true);
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== title) {
      renameProject(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const handleDuplicate = () => {
    const newName = prompt('Enter name for duplicate project:', `${title} (Copy)`);
    if (newName) {
      duplicateProject(newName);
    }
  };

  return (
    <>
      <div className="panel-header" style={styles.header}>
        <div style={styles.titleContainer}>
          {isEditing ? (
            <input
              autoFocus
              data-testid="project-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              style={styles.titleInput}
            />
          ) : (
            <h2
              data-testid="project-title"
              onClick={handleTitleClick}
              style={styles.title}
              title="Click to rename"
            >
              {title}
            </h2>
          )}
        </div>

        <div style={styles.actions}>
          <button
            onClick={() => openProject()}
            style={styles.actionButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <FolderOpen size={12} />
            Open
          </button>
          <button
            onClick={() => saveProject()}
            style={styles.actionButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Save size={12} />
            Save
          </button>
          <button
            onClick={() => saveProjectAs()}
            style={styles.actionButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <SaveAll size={12} />
            Save As
          </button>
          <button
            onClick={handleDuplicate}
            style={styles.actionButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <Copy size={12} />
            Duplicate
          </button>
          <button
            onClick={() => closeProject()}
            style={{ ...styles.actionButton, ...styles.actionButtonDanger }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--status-unsaved)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--status-unsaved)';
            }}
          >
            <X size={12} />
            Close
          </button>
        </div>
      </div>
      <div className="left-nav-body">
        <WorkspaceNav />
        <DraftList />
        <DisplayControls />
      </div>
    </>
  );
}
