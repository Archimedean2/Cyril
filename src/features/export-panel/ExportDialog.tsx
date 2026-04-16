import { useCallback } from 'react';
import { X, FileText, Printer } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import { ExportSettings } from '../../domain/project/types';
import { exportToMarkdown, exportToPrint } from '../../domain/export/exportService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeView = useProjectStore((state) => state.activeView);
  const exportSettings = useProjectStore((state) => state.currentProject?.project.exportSettings);
  const updateExportSetting = useProjectStore((state) => state.updateExportSetting);

  const handleExportMarkdown = useCallback(() => {
    if (!currentProject) return;
    const success = exportToMarkdown(currentProject, activeView.type === 'draft' ? activeView.draftId : null);
    if (success) {
      onClose();
    }
  }, [currentProject, activeView, onClose]);

  const handleExportPrint = useCallback(() => {
    if (!currentProject) return;
    const success = exportToPrint(currentProject, activeView.type === 'draft' ? activeView.draftId : null);
    if (success) {
      onClose();
    }
  }, [currentProject, activeView, onClose]);

  const handleToggle = (key: keyof ExportSettings) => {
    if (!exportSettings) return;
    const currentValue = exportSettings[key];
    updateExportSetting(key, !currentValue);
  };

  const handleDensityChange = (density: 'normal' | 'compact') => {
    updateExportSetting('pageDensity', density);
  };

  if (!isOpen || !exportSettings) return null;

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
      data-testid="export-dialog"
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
            Export
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
            data-testid="export-dialog-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #4a5565)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Format
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportMarkdown}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid var(--border-default, #c8d0db)',
                backgroundColor: 'var(--bg-panel, #f8f9fb)',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover, #e8edf3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-panel, #f8f9fb)';
              }}
              data-testid="export-markdown-button"
            >
              <FileText size={24} color="var(--text-secondary, #4a5565)" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #4a5565)',
                }}
              >
                Markdown
              </span>
            </button>
            <button
              onClick={handleExportPrint}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid var(--border-default, #c8d0db)',
                backgroundColor: 'var(--bg-panel, #f8f9fb)',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover, #e8edf3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-panel, #f8f9fb)';
              }}
              data-testid="export-print-button"
            >
              <Printer size={24} color="var(--text-secondary, #4a5565)" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #4a5565)',
                }}
              >
                Print / PDF
              </span>
            </button>
          </div>
        </div>

        {/* Include Toggles */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #4a5565)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Include
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Checkbox
              label="Section labels"
              checked={exportSettings.includeSectionLabels}
              onChange={() => handleToggle('includeSectionLabels')}
              testId="toggle-section-labels"
            />
            <Checkbox
              label="Speaker labels"
              checked={exportSettings.includeSpeakerLabels}
              onChange={() => handleToggle('includeSpeakerLabels')}
              testId="toggle-speaker-labels"
            />
            <Checkbox
              label="Stage directions"
              checked={exportSettings.includeStageDirections}
              onChange={() => handleToggle('includeStageDirections')}
              testId="toggle-stage-directions"
            />
            <Checkbox
              label="Chords"
              checked={exportSettings.includeChords}
              onChange={() => handleToggle('includeChords')}
              testId="toggle-chords"
            />
          </div>
        </div>

        {/* Density */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #4a5565)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Density
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <DensityOption
              label="Normal"
              selected={exportSettings.pageDensity === 'normal'}
              onClick={() => handleDensityChange('normal')}
              testId="density-normal"
            />
            <DensityOption
              label="Compact"
              selected={exportSettings.pageDensity === 'compact'}
              onClick={() => handleDensityChange('compact')}
              testId="density-compact"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Checkbox subcomponent
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  testId?: string;
}

function Checkbox({ label, checked, onChange, testId }: CheckboxProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontSize: '13px',
        color: 'var(--text-primary, #1f2430)',
      }}
      data-testid={testId}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          width: '16px',
          height: '16px',
          margin: 0,
          cursor: 'pointer',
        }}
      />
      <span>{label}</span>
    </label>
  );
}

// Density option subcomponent
interface DensityOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  testId?: string;
}

function DensityOption({ label, selected, onClick, testId }: DensityOptionProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 12px',
        borderRadius: '6px',
        border: `1px solid ${selected ? 'var(--accent-primary, #4f7db8)' : 'var(--border-default, #c8d0db)'}`,
        backgroundColor: selected ? 'var(--accent-soft, #d7e6f7)' : 'var(--bg-panel, #f8f9fb)',
        color: selected ? 'var(--accent-strong, #3d6da8)' : 'var(--text-secondary, #4a5565)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.1s ease',
      }}
      data-testid={testId}
    >
      {label}
    </button>
  );
}
