interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  title?: string;
  'data-testid'?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  title,
  'data-testid': testId,
}: ToggleSwitchProps) {
  return (
    <label className="toggle-switch-label nav-item">
      <span className="toggle-switch-track">
        <input
          type="checkbox"
          className="toggle-switch-input"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          title={title}
          data-testid={testId}
        />
        <span className="toggle-switch-thumb" aria-hidden="true" />
      </span>
      <span className="toggle-switch-text">{label}</span>
    </label>
  );
}
