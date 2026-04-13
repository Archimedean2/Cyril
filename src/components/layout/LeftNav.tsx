export function LeftNav() {
  return (
    <nav className="left-nav panel" aria-label="Left navigation">
      <div className="panel-header">
        <h2>Cyril</h2>
      </div>
      <div className="left-nav-body">
        <p className="section-label">Workspaces</p>
        <div className="nav-list">
          {/* Placeholder for workspaces */}
          <div className="nav-item">Brief</div>
          <div className="nav-item">Structure</div>
          <div className="nav-item">Hook Lab</div>
          <div className="nav-item">Vocabulary World</div>
        </div>
        
        <p className="section-label spacer-lg">Drafts</p>
        <div className="nav-list">
          {/* Placeholder for drafts */}
          <div className="nav-item nav-item-active">Draft 1</div>
        </div>
      </div>
    </nav>
  );
}
