import * as React from 'react';

export function RightSidebar() {
  return (
    <aside className="w-80 border-l bg-background flex flex-col h-full">
      <div className="flex-1 flex flex-col border-b min-h-0">
        <div className="h-10 border-b flex items-center px-4 shrink-0 bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tools</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-muted-foreground italic">
            Rhyme, Dictionary, Thesaurus will go here...
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-10 border-b flex items-center px-4 shrink-0 bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inventory</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-sm text-muted-foreground italic">
            Draft scratchpad will go here...
          </div>
        </div>
      </div>
    </aside>
  );
}
