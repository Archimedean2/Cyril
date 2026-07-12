import * as React from 'react';

interface ShortcutEntry {
  keys: string;
  label: string;
  group: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { group: 'File', keys: '⌘S', label: 'Save project' },
  { group: 'File', keys: '⌘⇧E', label: 'Export' },
  { group: 'View', keys: '⌘\\', label: 'Toggle focus mode' },
  { group: 'View', keys: '⌘[', label: 'Previous draft' },
  { group: 'View', keys: '⌘]', label: 'Next draft' },
  { group: 'Help', keys: '⌘K', label: 'Open command menu' },
  { group: 'Help', keys: 'Esc', label: 'Close dialogs / menus' },
];

interface CommandMenuProps {
  onClose: () => void;
}

export function CommandMenu({ onClose }: CommandMenuProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <div
      ref={overlayRef}
      className="command-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      data-testid="command-menu"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="command-menu-panel">
        <div className="command-menu-header">
          <span className="command-menu-title">Keyboard shortcuts</span>
          <button
            className="command-menu-close"
            onClick={onClose}
            aria-label="Close"
            data-testid="command-menu-close"
          >
            ✕
          </button>
        </div>
        <div className="command-menu-body">
          {groups.map((group) => (
            <div key={group} className="command-menu-group">
              <div className="command-menu-group-label">{group}</div>
              {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                <div key={s.keys} className="command-menu-row">
                  <span className="command-menu-label">{s.label}</span>
                  <kbd className="command-menu-kbd">{s.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
