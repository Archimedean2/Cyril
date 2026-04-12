import * as React from 'react';

export function CenterPane() {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      <header className="h-14 border-b flex items-center px-6">
        <h1 className="font-medium">Draft 1</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          {/* Placeholder for the rich text editor */}
          <div className="prose dark:prose-invert">
            <p className="text-muted-foreground italic">Editor will go here...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
