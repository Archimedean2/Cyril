import * as React from 'react';

export function LeftNav() {
  return (
    <nav className="w-64 border-r bg-muted/50 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Cyril</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm text-muted-foreground mb-2">Workspaces</div>
        <div className="space-y-1">
          {/* Placeholder for workspaces */}
          <div className="px-2 py-1 hover:bg-accent rounded cursor-pointer text-sm">Brief</div>
          <div className="px-2 py-1 hover:bg-accent rounded cursor-pointer text-sm">Structure</div>
          <div className="px-2 py-1 hover:bg-accent rounded cursor-pointer text-sm">Hook Lab</div>
          <div className="px-2 py-1 hover:bg-accent rounded cursor-pointer text-sm">Vocabulary World</div>
        </div>
        
        <div className="text-sm text-muted-foreground mb-2 mt-6">Drafts</div>
        <div className="space-y-1">
          {/* Placeholder for drafts */}
          <div className="px-2 py-1 bg-accent rounded cursor-pointer text-sm font-medium">Draft 1</div>
        </div>
      </div>
    </nav>
  );
}
