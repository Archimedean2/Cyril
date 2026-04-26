import { useState } from 'react';
import { X, Import } from 'lucide-react';

interface ShareImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (blob: string) => void;
}

export function ShareImportDialog({ isOpen, onClose, onImport }: ShareImportDialogProps) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'invalid'>('idle');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed.startsWith('cyril-share:')) {
      setStatus('invalid');
      return;
    }
    onImport(trimmed);
    setInput('');
    setStatus('idle');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      data-testid="share-import-dialog"
    >
      <div
        style={{
          backgroundColor: 'var(--bg-editor, #fcfcfd)',
          borderRadius: '8px',
          border: '1px solid var(--border-default, #c8d0db)',
          width: '420px',
          maxWidth: '90vw',
          padding: '16px',
          boxShadow: '0 1px 2px rgba(31, 36, 48, 0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary, #1f2430)',
            }}
          >
            Import from Share
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: 'var(--text-muted, #738093)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-testid="share-import-dialog-close"
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary, #4a5565)',
            marginBottom: '12px',
          }}
        >
          Paste a share blob copied from another Cyril instance.
        </p>

        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setStatus('idle');
          }}
          placeholder="cyril-share:..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '13px',
            fontFamily: 'monospace',
            borderRadius: '6px',
            border: `1px solid ${status === 'invalid' ? '#c44' : 'var(--border-default, #c8d0db)'}`,
            backgroundColor: 'var(--bg-panel, #f8f9fb)',
            color: 'var(--text-primary, #1f2430)',
            resize: 'vertical',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
          data-testid="share-import-input"
        />

        {status === 'invalid' && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--status-unsaved, #c44)',
              marginBottom: '12px',
            }}
          >
            Invalid share format. Must start with &quot;cyril-share:&quot;
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--accent-primary, #4f7db8)',
            backgroundColor: 'var(--accent-primary, #4f7db8)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.5,
          }}
          data-testid="share-import-submit"
        >
          <Import size={16} />
          Import Draft
        </button>
      </div>
    </div>
  );
}
