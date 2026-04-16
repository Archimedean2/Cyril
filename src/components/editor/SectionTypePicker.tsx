import { useEffect, useRef, useState } from 'react';

export type SectionPickerMode = 'insert' | 'change-or-new';

export interface SectionTypePickerProps {
  mode: SectionPickerMode;
  anchorRef: React.RefObject<HTMLElement>;
  onSelect: (action: 'insert' | 'change' | 'new', sectionType: string, customLabel?: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const SECTION_TYPES = [
  { value: 'verse', label: 'Verse' },
  { value: 'chorus', label: 'Chorus' },
  { value: 'pre-chorus', label: 'Pre-Chorus' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'intro', label: 'Intro' },
  { value: 'outro', label: 'Outro' },
  { value: 'spoken', label: 'Spoken' },
  { value: 'reprise', label: 'Reprise' },
  { value: 'custom', label: 'Custom…' },
];

export function SectionTypePicker({ mode, anchorRef, onSelect, onRemove, onClose }: SectionTypePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  const [activeAction, setActiveAction] = useState<'change' | 'new'>(mode === 'insert' ? 'new' : 'change');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'insert' | 'change' | 'new'>('insert');
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose]);

  function handleTypeClick(value: string, resolvedAction: 'insert' | 'change' | 'new') {
    if (value === 'custom') {
      setPendingAction(resolvedAction);
      setShowCustomInput(true);
      return;
    }
    onSelect(resolvedAction, value);
  }

  function handleRemove() {
    onRemove?.();
    onClose();
  }

  function handleCustomConfirm() {
    const label = customLabel.trim() || 'custom';
    onSelect(pendingAction, 'custom', label);
  }

  function stopAndHandle(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customLabel.trim()) handleCustomConfirm();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  const resolveAction = (): 'insert' | 'change' | 'new' => {
    if (mode === 'insert') return 'insert';
    return activeAction;
  };

  return (
    <div
      ref={pickerRef}
      className="section-type-picker"
      data-testid="section-type-picker"
    >
      {mode === 'change-or-new' && (
        <div className="stp-action-tabs">
          <button
            type="button"
            className={`stp-action-tab${activeAction === 'change' ? ' active' : ''}`}
            onClick={() => { setActiveAction('change'); setShowCustomInput(false); }}
          >
            Change type
          </button>
          <button
            type="button"
            className={`stp-action-tab${activeAction === 'new' ? ' active' : ''}`}
            onClick={() => { setActiveAction('new'); setShowCustomInput(false); }}
          >
            New section
          </button>
          <button
            type="button"
            className="stp-action-tab stp-remove-tab"
            onClick={handleRemove}
            data-testid="section-remove-button"
          >
            Remove
          </button>
        </div>
      )}

      {showCustomInput ? (
        <div className="stp-custom-input-row">
          <input
            type="text"
            className="stp-custom-input"
            placeholder="Label…"
            value={customLabel}
            autoFocus
            onChange={e => setCustomLabel(e.target.value)}
            onKeyDown={stopAndHandle}
            onKeyPress={e => e.stopPropagation()}
            onKeyUp={e => e.stopPropagation()}
            data-testid="section-custom-input"
          />
          <button
            type="button"
            className="stp-custom-confirm"
            onClick={handleCustomConfirm}
          >
            ✓
          </button>
        </div>
      ) : (
        <ul className="stp-type-list">
          {SECTION_TYPES.map(({ value, label }) => (
            <li key={value}>
              <button
                type="button"
                className="stp-type-option"
                data-testid={`section-type-option-${value}`}
                onClick={() => handleTypeClick(value, resolveAction())}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
