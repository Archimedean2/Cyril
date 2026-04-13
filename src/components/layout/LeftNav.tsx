import * as React from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { WorkspaceNav } from '../../features/workspace-nav/WorkspaceNav';
import { DraftList } from '../../features/draft-manager/DraftList';
import { DisplayControls } from '../../features/display-controls/DisplayControls';

export function LeftNav() {
  const { currentProject, renameProject, saveProject, saveProjectAs, duplicateProject, closeProject } = useProjectStore();
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
    <nav className="left-nav panel" aria-label="Left navigation">
      <div className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isEditing ? (
            <input
              autoFocus
              data-testid="project-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              style={{ width: '100%', padding: '2px 4px', fontSize: '1.125rem', fontWeight: 600 }}
            />
          ) : (
            <h2 
              data-testid="project-title"
              onClick={handleTitleClick} 
              style={{ cursor: 'pointer' }} 
              title="Click to rename"
            >
              {title}
            </h2>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => saveProject()} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>Save</button>
          <button onClick={() => saveProjectAs()} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>Save As</button>
          <button onClick={handleDuplicate} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>Duplicate</button>
          <button onClick={() => closeProject()} style={{ fontSize: '0.75rem', padding: '2px 6px', color: 'red' }}>Close</button>
        </div>
      </div>
      <div className="left-nav-body">
        <WorkspaceNav />
        <DraftList />
        <DisplayControls />
      </div>
    </nav>
  );
}
