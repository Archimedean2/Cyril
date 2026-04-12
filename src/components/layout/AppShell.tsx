import * as React from 'react';
import { LeftNav } from './LeftNav';
import { CenterPane } from './CenterPane';
import { RightSidebar } from './RightSidebar';
import { EmptyState } from './EmptyState';
import { useProjectStore } from '../../app/state/projectStore';

export function AppShell() {
  const isProjectLoaded = useProjectStore((state) => state.isProjectLoaded);

  if (!isProjectLoaded) {
    return <EmptyState />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <LeftNav />
      <CenterPane />
      <RightSidebar />
    </div>
  );
}
