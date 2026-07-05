import { useRef, useState, useEffect, RefObject } from 'react';

interface InsertConcurrentBlockDialogProps {
  anchorRef: RefObject<HTMLButtonElement | null>;
  onConfirm: (speakers: string[]) => void;
  onClose: () => void;
}

export function InsertConcurrentBlockDialog({
  anchorRef,
  onConfirm,
  onClose,
}: InsertConcurrentBlockDialogProps) {
  const DEFAULTS = ['Speaker A', 'Speaker B', 'Speaker C', 'Speaker D'];
  const [speakerCount, setSpeakerCount] = useState(2);
  const [names, setNames] = useState<string[]>([...DEFAULTS]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCountChange = (n: number) => {
    setSpeakerCount(n);
  };

  const handleNameChange = (i: number, value: string) => {
    setNames(prev => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const LETTERS = ['A', 'B', 'C', 'D'];
  const handleConfirm = () => {
    const speakers = names.slice(0, speakerCount).map((n, i) => n.trim() || `Speaker ${LETTERS[i]}`);
    onConfirm(speakers);
  };

  return (
    <div
      ref={dialogRef}
      className="insert-concurrent-dialog"
      data-testid="insert-concurrent-dialog"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 200,
        background: 'var(--bg-editor)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '12px 14px',
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 10, color: 'var(--text-primary)' }}>
        Insert Concurrent Block
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Number of speakers
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => handleCountChange(n)}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-xs)',
                border: `1px solid ${speakerCount === n ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                background: speakerCount === n ? 'var(--accent-primary)' : 'transparent',
                color: speakerCount === n ? 'var(--text-inverse)' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: speakerCount === n ? 600 : 400,
              }}
              data-testid={`concurrent-count-${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Speaker names
        </label>
        {Array.from({ length: speakerCount }, (_, i) => (
          <input
            key={i}
            type="text"
            value={names[i] || ''}
            onChange={e => handleNameChange(i, e.target.value)}
            placeholder={`Speaker ${LETTERS[i]}`}
            style={{
              display: 'block',
              width: '100%',
              marginBottom: 4,
              padding: '4px 6px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.75rem',
              boxSizing: 'border-box',
            }}
            data-testid={`concurrent-speaker-name-input-${i}`}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-default)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.75rem',
          }}
          data-testid="concurrent-dialog-cancel"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
          data-testid="concurrent-dialog-confirm"
        >
          Insert
        </button>
      </div>
    </div>
  );
}
