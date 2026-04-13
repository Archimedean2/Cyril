export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-card">
        <h2 className="empty-state-title">Welcome to Cyril</h2>
        <p className="empty-state-copy">Open an existing project or create a new one.</p>
        <div className="empty-state-actions">
          <button className="primary-button">
            Create Project
          </button>
          <button className="secondary-button">
            Open Project
          </button>
        </div>
      </div>
    </div>
  );
}
