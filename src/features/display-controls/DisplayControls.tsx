import { useProjectStore } from '../../app/state/projectStore';

export function DisplayControls() {
  const { currentProject, activeView } = useProjectStore();

  // Only show display controls when looking at a draft
  if (!currentProject || activeView.type !== 'draft') return null;

  // Placeholder for toggles that will be implemented in Stage 4+
  return (
    <div className="display-controls" style={{ marginTop: '24px' }}>
      <p className="section-label">View</p>
      <div className="nav-list" style={{ fontSize: '0.85rem' }}>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" disabled checked />
          <span>Sections</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" disabled checked />
          <span>Speakers</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" disabled checked />
          <span>Stage Dir</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" disabled />
          <span>Chords</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" disabled />
          <span>Syllables</span>
        </label>
      </div>
    </div>
  );
}
