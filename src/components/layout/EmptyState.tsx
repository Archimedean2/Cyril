import { useProjectStore } from '../../app/state/projectStore';

interface EmptyStateProps {
  onImportShare?: () => void;
}

export function EmptyState({ onImportShare }: EmptyStateProps) {
  const { createProject, openProject, error, clearError } = useProjectStore();

  return (
    <div className="empty-state">
      <div className="empty-state-card">
        <h2 className="empty-state-title">Welcome to Cyril</h2>
        <p className="empty-state-copy">Open an existing project or create a new one.</p>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '0.25rem' }}>
            <p>{error}</p>
            <button onClick={clearError} style={{ fontSize: '0.8rem', textDecoration: 'underline', marginTop: '0.25rem' }}>Dismiss</button>
          </div>
        )}

        <div className="empty-state-actions">
          <button className="primary-button" data-testid="create-project-button" onClick={() => createProject()}>
            Create Project
          </button>
          <button className="secondary-button" onClick={() => openProject()}>
            Open Project
          </button>
          {onImportShare && (
            <button className="secondary-button" onClick={onImportShare} data-testid="import-share-button">
              Import from Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
