import { useState } from 'react';
import { ToolLookupResponse, ToolResult, ToolMode, ToolResultSource } from '../../domain/tools/types';

interface PaneResponse extends ToolLookupResponse {
  source?: ToolResultSource;
}

interface ToolsResultsListProps {
  response: PaneResponse | null;
  onCopyResult: (text: string) => void | Promise<boolean>;
  onCollectResult: (text: string) => void;
}

const RHYME_MODES: ToolMode[] = ['rhyme-exact', 'rhyme-near'];

export function ToolsResultsList({ response, onCopyResult, onCollectResult }: ToolsResultsListProps) {
  if (!response) {
    return (
      <div className="tools-results-empty" data-testid="tools-results-empty">
        <p>Search for a word to see rhymes, synonyms, definitions, and related words.</p>
      </div>
    );
  }

  if (response.loading) {
    return (
      <div className="tools-results-loading" data-testid="tools-results-loading">
        <p>Loading…</p>
      </div>
    );
  }

  // Honest offline / provider-failed state — never spin forever. We show a plain,
  // human message rather than surfacing the raw provider/network error text.
  if (response.error) {
    return (
      <div className="tools-results-offline" data-testid="tools-results-offline">
        <p>Can&apos;t reach the word service. Check your connection and try again.</p>
      </div>
    );
  }

  if (response.results.length === 0) {
    return (
      <div className="tools-results-empty" data-testid="tools-results-empty">
        <p>No results found for &quot;{response.term}&quot;</p>
      </div>
    );
  }

  const isRhymeMode = RHYME_MODES.includes(response.mode);
  const isFromCache = response.source === 'cache' || response.source === 'cache-fallback';

  return (
    <div className="tools-results-wrapper">
      {isFromCache && (
        <div className="tools-results-cache-note" data-testid="tools-results-cache-note">
          {response.source === 'cache-fallback'
            ? 'Offline — showing cached results'
            : 'Showing cached results'}
        </div>
      )}

      {isRhymeMode ? (
        <RhymeResultsList
          results={response.results}
          onCopy={onCopyResult}
          onCollect={onCollectResult}
        />
      ) : (
        <div className="tools-results-list" data-testid="tools-results-list">
          {response.results.map((result, index) => (
            <ResultItem
              key={`${result.word}-${index}`}
              result={result}
              mode={response.mode}
              onCopy={() => onCopyResult(result.word)}
              onCollect={() => onCollectResult(result.word)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Ephemeral "Copied" / "Collected" feedback, distinguishing the two gestures. */
function useGestureFeedback() {
  const [feedback, setFeedback] = useState<'copied' | 'collected' | 'copy-failed' | null>(null);

  const flash = (type: 'copied' | 'collected' | 'copy-failed') => {
    setFeedback(type);
    window.setTimeout(() => setFeedback((current) => (current === type ? null : current)), 1200);
  };

  /** Flash the truth: "Copied" only when the clipboard actually took it. */
  const flashCopy = async (result: void | Promise<boolean> | boolean) => {
    const ok = typeof result === 'object' && result !== null && 'then' in result
      ? await (result as Promise<boolean>)
      : result !== false;
    flash(ok ? 'copied' : 'copy-failed');
  };

  return { feedback, flash, flashCopy };
}

const FEEDBACK_LABEL: Record<'copied' | 'collected' | 'copy-failed', string> = {
  copied: 'Copied',
  collected: 'Collected',
  'copy-failed': "Couldn't copy",
};

/** Groups rhyme results by syllable count and renders them with bold high-relevance words */
function RhymeResultsList({ results, onCopy, onCollect }: { results: ToolResult[]; onCopy: (w: string) => void; onCollect: (w: string) => void }) {
  // Determine high-relevance threshold: top 30% by score
  const scores = results.map(r => r.score ?? 0).filter(s => s > 0);
  const highThreshold = scores.length > 0
    ? scores.slice().sort((a, b) => b - a)[Math.floor(scores.length * 0.3)]
    : Infinity;

  // Group by syllable count; words with no syllable data go into group 0
  const groups = new Map<number, ToolResult[]>();
  for (const result of results) {
    const key = result.numSyllables ?? 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(result);
  }

  // Sort words within each group lexicographically
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.word.localeCompare(b.word));
  }

  // If any word has a real syllable count, drop the key=0 fallback group
  const hasRealSyllables = [...groups.keys()].some(k => k > 0);
  const sortedKeys = [...groups.keys()]
    .filter(k => !(hasRealSyllables && k === 0))
    .sort((a, b) => a - b);

  return (
    <div className="tools-results-list tools-results-rhyme" data-testid="tools-results-list">
      {sortedKeys.map(key => (
        <div key={key} className="rhyme-syllable-group">
          <div className="rhyme-syllable-label">
            {key === 0 ? 'other' : `${key}-syllable`}
          </div>
          <div className="rhyme-word-row">
            {groups.get(key)!.map((result, i) => {
              const isHigh = (result.score ?? 0) >= highThreshold;
              return (
                <RhymeWord
                  key={`${result.word}-${i}`}
                  word={result.word}
                  isHigh={isHigh}
                  isFirst={i === 0}
                  onCopy={onCopy}
                  onCollect={onCollect}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RhymeWord({ word, isHigh, isFirst, onCopy, onCollect }: {
  word: string;
  isHigh: boolean;
  isFirst: boolean;
  onCopy: (w: string) => void;
  onCollect: (w: string) => void;
}) {
  const { feedback, flash, flashCopy } = useGestureFeedback();

  return (
    <span className="rhyme-word-wrap">
      {!isFirst && <span className="rhyme-sep">,</span>}
      <span
        className={`rhyme-word${isHigh ? ' rhyme-word-bold' : ''}`}
        onClick={() => { void flashCopy(onCopy(word)); }}
        onDoubleClick={(e) => { e.preventDefault(); onCollect(word); flash('collected'); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void flashCopy(onCopy(word)); } }}
        role="button"
        tabIndex={0}
        title="Click to copy · double-click to collect"
        data-testid="tools-result-item"
      >
        {word}
      </span>
      <button
        type="button"
        className="rhyme-collect-btn"
        data-testid="tools-collect-button"
        aria-label={`Collect "${word}" into Inventory`}
        title="Add to Inventory"
        onClick={() => { onCollect(word); flash('collected'); }}
      >
        +
      </button>
      {feedback && (
        <span className={`tools-result-feedback tools-result-feedback-${feedback}`} data-testid="tools-result-feedback">
          {FEEDBACK_LABEL[feedback]}
        </span>
      )}
    </span>
  );
}

interface ResultItemProps {
  result: ToolResult;
  mode: string;
  onCopy: () => void;
  onCollect: () => void;
}

function ResultItem({ result, mode, onCopy, onCollect }: ResultItemProps) {
  const { feedback, flash, flashCopy } = useGestureFeedback();

  return (
    <div
      className="tools-result-item"
      onClick={() => { void flashCopy(onCopy()); }}
      onDoubleClick={(e) => { e.preventDefault(); onCollect(); flash('collected'); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void flashCopy(onCopy()); } }}
      role="button"
      tabIndex={0}
      data-testid="tools-result-item"
      title="Click to copy · double-click to collect"
    >
      <div className="tools-result-row">
        <div className="tools-result-word">{result.word}</div>
        <button
          type="button"
          className="tools-collect-button"
          data-testid="tools-collect-button"
          aria-label={`Collect "${result.word}" into Inventory`}
          title="Add to Inventory"
          onClick={(e) => { e.stopPropagation(); onCollect(); flash('collected'); }}
        >
          + collect
        </button>
      </div>

      {mode === 'dictionary' && result.definition && (
        <div className="tools-result-definition">
          {result.partOfSpeech && (
            <span className="tools-result-pos">{result.partOfSpeech}</span>
          )}
          <span className="tools-result-def-text">{result.definition}</span>
        </div>
      )}

      {feedback && (
        <span className={`tools-result-feedback tools-result-feedback-${feedback}`} data-testid="tools-result-feedback">
          {FEEDBACK_LABEL[feedback]}
        </span>
      )}
    </div>
  );
}
