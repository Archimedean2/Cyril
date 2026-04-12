import * as React from 'react';

export function EmptyState() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Welcome to Cyril</h2>
        <p className="text-muted-foreground mb-6">Open an existing project or create a new one.</p>
        <div className="flex justify-center gap-4">
          <button className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors">
            Create Project
          </button>
          <button className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium transition-colors">
            Open Project
          </button>
        </div>
      </div>
    </div>
  );
}
