import { CyrilMark } from '../brand/CyrilLogo';
import { useProjectStore } from '../../app/state/projectStore';

interface LaunchScreenProps {
  onImportShare: () => void;
}

const FALLBACK_QUOTE = ['Something beautiful', 'is waiting', 'to be written.'];

export function LaunchScreen({ onImportShare }: LaunchScreenProps) {
  const createProject = useProjectStore((s) => s.createProject);
  const openProject = useProjectStore((s) => s.openProject);

  return (
    <div className="launch-screen" data-testid="launch-screen">
      {/* Left column: logo top, actions bottom */}
      <div className="launch-left">
        <div className="launch-logo" data-testid="launch-logo">
          <CyrilMark size={72} />
          <span className="launch-wordmark">Cyril</span>
        </div>

        <nav className="launch-actions" aria-label="Start">
          <span className="launch-begin-label">BEGIN</span>
          <button
            className="launch-link"
            data-testid="create-project-button"
            onClick={() => createProject()}
          >
            Create something
          </button>
          <button className="launch-link" onClick={() => openProject()}>
            Improve something
          </button>
          <button
            className="launch-link"
            data-testid="import-share-button"
            onClick={onImportShare}
          >
            Share a draft
          </button>
        </nav>
      </div>

      {/* Right column: pull-quote */}
      <aside className="launch-quote-panel" data-testid="launch-quote-panel">
        <span className="launch-quote-mark launch-quote-open" aria-hidden="true">&ldquo;</span>
        <blockquote className="launch-quote-text">
          {FALLBACK_QUOTE.map((line, i) => (
            <span key={i} className="launch-quote-line">{line}</span>
          ))}
        </blockquote>
        <span className="launch-quote-mark launch-quote-close" aria-hidden="true">&rdquo;</span>
        <p className="launch-quote-caption">your draft, your words</p>
      </aside>

      {/* Decorative quill — bottom, line-art at low opacity */}
      <div className="launch-quill-bg" aria-hidden="true">
        <svg viewBox="0 0 44 48" className="launch-quill-svg" preserveAspectRatio="xMidYMid meet">
          <path
            d="M35 7 C24 11 15 22 11 36 L8 43 C10 39 13 35 17 32 C25 26 32 16 36 9 C37 7 36 6 35 7 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.25"
          />
          <path
            d="M33 11 C25 17 18 26 12 37"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.18"
            strokeLinecap="round"
          />
          <path
            d="M30 15 L34 13 M25.5 21 L30 19 M21 27.5 L25.5 25.5 M16.5 34 L21 32.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.15"
            strokeLinecap="round"
          />
          <circle cx="8" cy="43.5" r="1.2" fill="var(--accent-primary)" />
        </svg>
      </div>
    </div>
  );
}
