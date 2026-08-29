import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, FileText, Printer, Share2 } from 'lucide-react';
import { useProjectStore } from '../../app/state/projectStore';
import { ExportSettings } from '../../domain/project/types';
import { exportToMarkdown, exportToPrint, getPrintPreviewHtml } from '../../domain/export/exportService';
import { copyShareLink } from '../../domain/share/shareService';
import { PRINT_PROFILES, PrintProfileId, DEFAULT_PRINT_PROFILE, getStoredPrintProfile } from '../../domain/export/exportTypes';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const activeView = useProjectStore((state) => state.activeView);
  const exportSettings = useProjectStore((state) => state.currentProject?.project.exportSettings);
  const updateExportSetting = useProjectStore((state) => state.updateExportSetting);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [printPanelOpen, setPrintPanelOpen] = useState(false);

  // Default export settings when no project is loaded
  const defaultExportSettings: ExportSettings = {
    includeSectionLabels: true,
    includeSpeakerLabels: true,
    includeStageDirections: true,
    includeChords: true,
    fontPreset: 'default',
    pageDensity: 'normal',
    concurrentLayout: 'squash',
    printProfile: DEFAULT_PRINT_PROFILE,
  };

  const currentExportSettings = exportSettings || defaultExportSettings;
  const selectedProfile = getStoredPrintProfile(currentExportSettings);
  const activeDraftId = activeView.type === 'draft' ? activeView.draftId : null;

  // Close the print panel whenever the dialog itself closes, so reopening
  // it starts from the format picker rather than a stale preview.
  useEffect(() => {
    if (!isOpen) setPrintPanelOpen(false);
  }, [isOpen]);

  // Each print profile produces visibly different output from the same
  // draft (C-22) — recompute the preview whenever the profile changes, or
  // any project state changes (e.g. the section-labels/density toggles,
  // which live on `currentProject.project.exportSettings`).
  const previewHtml = useMemo(() => {
    if (!printPanelOpen || !currentProject) return null;
    return getPrintPreviewHtml(currentProject, activeDraftId, selectedProfile);
  }, [printPanelOpen, currentProject, activeDraftId, selectedProfile]);

  const handleExportMarkdown = useCallback(() => {
    if (!currentProject) return;
    const success = exportToMarkdown(currentProject, activeDraftId);
    if (success) {
      onClose();
    }
  }, [currentProject, activeDraftId, onClose]);

  const handleTogglePrintPanel = useCallback(() => {
    setPrintPanelOpen((open) => !open);
  }, []);

  const handleSelectProfile = useCallback((profile: PrintProfileId) => {
    updateExportSetting('printProfile', profile);
  }, [updateExportSetting]);

  const handleConfirmPrint = useCallback(() => {
    if (!currentProject) return;
    const success = exportToPrint(currentProject, activeDraftId, selectedProfile);
    if (success) {
      setPrintPanelOpen(false);
      onClose();
    }
  }, [currentProject, activeDraftId, selectedProfile, onClose]);

  const handleShareCopy = useCallback(async () => {
    if (!currentProject) {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
      return;
    }
    const result = await copyShareLink(currentProject, activeView.type === 'draft' ? activeView.draftId : null);
    if (result.success) {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } else {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  }, [currentProject, activeView]);

  const handleToggle = (key: keyof ExportSettings) => {
    if (!exportSettings) return;
    const currentValue = currentExportSettings[key];
    updateExportSetting(key, !currentValue);
  };

  const handleDensityChange = (density: 'normal' | 'compact') => {
    updateExportSetting('pageDensity', density);
  };

  if (!isOpen) return null;

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
          maxHeight: '90vh',
          overflowY: 'auto',
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
              onClick={handleTogglePrintPanel}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '16px',
                borderRadius: '6px',
                border: `1px solid ${printPanelOpen ? 'var(--accent-primary, #4f7db8)' : 'var(--border-default, #c8d0db)'}`,
                backgroundColor: printPanelOpen ? 'var(--accent-soft, #d7e6f7)' : 'var(--bg-panel, #f8f9fb)',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!printPanelOpen) e.currentTarget.style.backgroundColor = 'var(--bg-hover, #e8edf3)';
              }}
              onMouseLeave={(e) => {
                if (!printPanelOpen) e.currentTarget.style.backgroundColor = 'var(--bg-panel, #f8f9fb)';
              }}
              data-testid="export-print-button"
              aria-expanded={printPanelOpen}
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
            <button
              onClick={handleShareCopy}
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
              data-testid="export-share-button"
            >
              <Share2 size={24} color="var(--text-secondary, #4a5565)" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary, #4a5565)',
                }}
              >
                {shareStatus === 'copied' ? 'Copied!' : shareStatus === 'error' ? 'Failed' : 'Copy Share'}
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
              checked={currentExportSettings.includeSectionLabels}
              onChange={() => handleToggle('includeSectionLabels')}
              testId="toggle-section-labels"
            />
            <Checkbox
              label="Speaker labels"
              checked={currentExportSettings.includeSpeakerLabels}
              onChange={() => handleToggle('includeSpeakerLabels')}
              testId="toggle-speaker-labels"
            />
            <Checkbox
              label="Stage directions"
              checked={currentExportSettings.includeStageDirections}
              onChange={() => handleToggle('includeStageDirections')}
              testId="toggle-stage-directions"
            />
            <Checkbox
              label="Chords"
              checked={currentExportSettings.includeChords}
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
              selected={currentExportSettings.pageDensity === 'normal'}
              onClick={() => handleDensityChange('normal')}
              testId="density-normal"
            />
            <DensityOption
              label="Compact"
              selected={currentExportSettings.pageDensity === 'compact'}
              onClick={() => handleDensityChange('compact')}
              testId="density-compact"
            />
          </div>
        </div>

        {/* Print profile panel — opened by the "Print / PDF" format button. */}
        {printPanelOpen && (
          <div
            data-testid="print-profile-panel"
            style={{
              marginTop: '4px',
              marginBottom: '4px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-default, #c8d0db)',
            }}
          >
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
              Print profile
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              {PRINT_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  data-testid={`print-profile-${profile.id}`}
                  aria-pressed={selectedProfile === profile.id}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${
                      selectedProfile === profile.id
                        ? 'var(--accent-primary, #4f7db8)'
                        : 'var(--border-default, #c8d0db)'
                    }`,
                    backgroundColor:
                      selectedProfile === profile.id
                        ? 'var(--accent-soft, #d7e6f7)'
                        : 'var(--bg-panel, #f8f9fb)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary, #1f2430)',
                    }}
                  >
                    {profile.label}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary, #4a5565)',
                      marginTop: '2px',
                      lineHeight: 1.3,
                    }}
                  >
                    {profile.description}
                  </div>
                </button>
              ))}
            </div>

            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary, #4a5565)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Preview
            </div>
            <div
              style={{
                border: '1px solid var(--border-default, #c8d0db)',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '240px',
                backgroundColor: '#fff',
                marginBottom: '16px',
              }}
            >
              {previewHtml ? (
                <iframe
                  title="Print preview"
                  data-testid="print-preview-frame"
                  srcDoc={previewHtml}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div
                  style={{
                    padding: '16px',
                    fontSize: '12px',
                    color: 'var(--text-muted, #738093)',
                  }}
                >
                  Nothing to preview yet.
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmPrint}
              data-testid="print-confirm-button"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent-primary, #4f7db8)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Print / Save PDF
            </button>
          </div>
        )}
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
