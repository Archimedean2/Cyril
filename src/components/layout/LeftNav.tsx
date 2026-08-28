import { WorkspaceNav } from '../../features/workspace-nav/WorkspaceNav';
import { DraftList } from '../../features/draft-manager/DraftList';
import { DisplayControls } from '../../features/display-controls/DisplayControls';

// The song title lives in the top bar only (click-to-rename there). The left nav
// leads straight with its own content — Project / Drafts / View — so no vertical
// space is spent repeating identity that's already shown in the chrome above.
export function LeftNav() {
  return (
    <div className="left-nav-body">
      <WorkspaceNav />
      <DraftList />
      <DisplayControls />
    </div>
  );
}
