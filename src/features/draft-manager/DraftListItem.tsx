export function DraftListItem({ 
  name, 
  isActive, 
  onSelect 
}: { 
  name: string; 
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-selected={isActive}
      title={name}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </div>
  );
}
