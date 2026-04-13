export function CenterPane() {
  return (
    <main className="center-pane panel" aria-label="Center content area">
      <header className="panel-header">
        <h1>Draft 1</h1>
      </header>
      <div className="center-pane-body">
        <div className="editor-placeholder">
          {/* Placeholder for the rich text editor */}
          <p>Editor will go here...</p>
        </div>
      </div>
    </main>
  );
}
