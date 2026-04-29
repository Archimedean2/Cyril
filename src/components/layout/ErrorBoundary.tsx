import * as React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Human-readable name for the pane (used in the default fallback message). */
  paneName?: string;
  /**
   * Optional custom fallback. If provided, replaces the default UI when an error is caught.
   * If omitted, a built-in message + "Reload" button is rendered.
   */
  fallback?: React.ReactNode;
  /** Optional callback invoked when an error is caught (e.g. for telemetry or tests). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /**
   * Optional handler for the "Reload" button. Defaults to `window.location.reload()`.
   * Provided primarily for testability.
   */
  onReload?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const fallbackStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: 'var(--space-4, 16px)',
    margin: 'var(--space-3, 12px)',
    color: 'var(--text-default, #2c3142)',
    background: 'var(--bg-panel, #ffffff)',
    border: '1px solid var(--border-subtle, #e3e6ed)',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    margin: 0,
  },
  message: {
    fontSize: '13px',
    color: 'var(--text-muted, #738093)',
    margin: 0,
  },
  button: {
    fontSize: '13px',
    padding: '6px 12px',
    border: '1px solid var(--border-strong, #c8cdd6)',
    borderRadius: '4px',
    background: 'var(--bg-button, #ffffff)',
    color: 'var(--text-default, #2c3142)',
    cursor: 'pointer',
  },
};

/**
 * React error boundary. Catches render-time errors in its subtree and shows a recoverable
 * fallback UI so a single pane crash does not bring down the rest of the app shell.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private handleReload = (): void => {
    if (this.props.onReload) {
      this.props.onReload();
      return;
    }
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.error) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      const where = this.props.paneName ? ` in the ${this.props.paneName}` : '';
      return (
        <div
          role="alert"
          data-testid="error-boundary-fallback"
          style={fallbackStyles.container}
        >
          <h3 style={fallbackStyles.title}>Something went wrong{where}.</h3>
          <p style={fallbackStyles.message}>
            This pane couldn&apos;t be displayed. Reload the page to try again.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={fallbackStyles.button}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
