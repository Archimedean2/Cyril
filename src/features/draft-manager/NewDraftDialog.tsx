import * as React from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { DuplicationMode } from '../../domain/project/drafts';

interface NewDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewDraftDialog({ isOpen, onClose }: NewDraftDialogProps) {
  const { currentProject, addDraft } = useProjectStore();
  const [name, setName] = React.useState('');
  const [mode, setMode] = React.useState<DuplicationMode>('blank');
  const [sourceDraftId, setSourceDraftId] = React.useState('');

  const drafts = currentProject?.project.drafts || [];

  React.useEffect(() => {
    if (isOpen && drafts.length > 0) {
      setSourceDraftId(drafts[0].id);
      setName(`Draft ${drafts.length + 1}`);
    }
  }, [isOpen, drafts]);

  if (!isOpen || !currentProject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    addDraft(name.trim(), mode !== 'blank' ? sourceDraftId : undefined, mode);
    onClose();
  };

  return (
    <div className="dialog-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(31, 36, 48, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="dialog-container" style={{
        width: '420px',
        padding: '16px',
        backgroundColor: 'var(--bg-editor)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>New Draft</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%', 
                height: '32px', 
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-editor)'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Start from:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="duplicationMode" 
                  value="blank" 
                  checked={mode === 'blank'} 
                  onChange={() => setMode('blank')} 
                />
                Blank
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="duplicationMode" 
                  value="text" 
                  checked={mode === 'text'} 
                  onChange={() => setMode('text')} 
                />
                Duplicate text only
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="duplicationMode" 
                  value="inventory" 
                  checked={mode === 'inventory'} 
                  onChange={() => setMode('inventory')} 
                />
                Duplicate inventory only
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="duplicationMode" 
                  value="both" 
                  checked={mode === 'both'} 
                  onChange={() => setMode('both')} 
                />
                Duplicate both
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '24px', opacity: mode === 'blank' ? 0.5 : 1 }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Source draft:
            </label>
            <select
              value={sourceDraftId}
              onChange={(e) => setSourceDraftId(e.target.value)}
              disabled={mode === 'blank'}
              style={{ 
                width: '100%', 
                height: '32px', 
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-editor)'
              }}
            >
              {drafts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                height: '32px',
                padding: '0 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              style={{
                height: '32px',
                padding: '0 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: !name.trim() ? 0.5 : 1
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
