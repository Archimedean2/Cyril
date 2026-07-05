import { useProjectStore } from '../../app/state/projectStore';
import { CyrilLogo } from '../brand/CyrilLogo';

interface EmptyStateProps {
  onImportShare?: () => void;
}

export function EmptyState({ onImportShare }: EmptyStateProps) {
  const createProject = useProjectStore((s) => s.createProject);
  const openProject = useProjectStore((s) => s.openProject);
  const error = useProjectStore((s) => s.error);
  const clearError = useProjectStore((s) => s.clearError);

  return (
    <div className="empty-state">
      <div className="empty-state-card">
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <CyrilLogo />
        </div>

        {error && (
          <div
            style={{
              color: 'var(--status-error)',
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={clearError}
              style={{ fontSize: '0.8rem', textDecoration: 'underline', marginTop: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              Dismiss
            </button>
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
