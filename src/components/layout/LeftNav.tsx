import * as React from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { WorkspaceNav } from '../../features/workspace-nav/WorkspaceNav';
import { DraftList } from '../../features/draft-manager/DraftList';
import { DisplayControls } from '../../features/display-controls/DisplayControls';

const styles: Record<string, React.CSSProperties> = {
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
};

export function LeftNav() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const renameProject = useProjectStore((s) => s.renameProject);
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

  return (
    <>
      <div className="panel-header">
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
      <div className="left-nav-body">
        <WorkspaceNav />
        <DraftList />
        <DisplayControls />
      </div>
    </>
  );
}
