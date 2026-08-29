import { useState } from 'react';
import { ToolLookupResponse, ToolResult, ToolMode, ToolResultSource } from '../../domain/tools/types';

interface PaneResponse extends ToolLookupResponse {
  source?: ToolResultSource;
}

interface ToolsResultsListProps {
  response: PaneResponse | null;
  onCopyResult: (text: string) => void | Promise<boolean>;
  onCollectResult: (text: string) => void;
  /** C-44 / DESIGN_PROPOSAL.md §13.4: whether a result's word already appears in the
   * active draft or is already collected into Inventory. Optional so this component
   * still works standalone (e.g. in tests) without the derivation wired up; absent
   * means "nothing is used" rather than an error. */
  isResultUsed?: (word: string) => boolean;
}

const RHYME_MODES: ToolMode[] = ['rhyme-exact', 'rhyme-near'];

/**
 * C-45 / DESIGN_PROPOSAL.md §13.5: an ABSOLUTE Datamuse relevance-score threshold for
 * bolding a rhyme result, replacing the old relative "top 30% of whatever came back"
 * rule (which still bolded a third of a weak set, junk like "klepht"/"tefft" included).
 *
 * Chosen by sampling real `rel_rhy` scores from the Datamuse API (2026-08-29):
 *   - "left" → bereft 46033, cleft 19046, deft 9035, theft 7049, heft 6036, then a
 *     cliff to gill cleft 1014, effed 1009, antitheft 1008, klepht 13. 5000 sits
 *     exactly in that cliff: every genuine dictionary rhyme clears it, every junk/
 *     obscure entry from DEFECTS.md D-22's "left" example falls below it.
 *   - "day"/"night" (200 results each, common words): ~24-26% of results clear 5000,
 *     so a rich result set still shows a meaningful, non-dominant emphasised subset.
 *   - "love"/"time" (weaker, sparser result sets): only 1-9% of results clear 5000 —
 *     a weak set correctly ends up mostly or entirely unemphasised.
 * Datamuse scores are frequency-weighted, not a clean 0-100 "rhyme quality" scale, so
 * this is a practical cliff found in real data rather than a theoretically pure cutoff.
 */
const RHYME_EMPHASIS_SCORE_THRESHOLD = 5000;

export function ToolsResultsList({ response, onCopyResult, onCollectResult, isResultUsed }: ToolsResultsListProps) {
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
          isResultUsed={isResultUsed}
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
              isUsed={isResultUsed ? isResultUsed(result.word) : false}
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
function RhymeResultsList({ results, onCopy, onCollect, isResultUsed }: {
  results: ToolResult[];
  onCopy: (w: string) => void;
  onCollect: (w: string) => void;
  isResultUsed?: (word: string) => boolean;
}) {
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
              const isHigh = (result.score ?? 0) >= RHYME_EMPHASIS_SCORE_THRESHOLD;
              return (
                <RhymeWord
                  key={`${result.word}-${i}`}
                  word={result.word}
                  isHigh={isHigh}
                  isFirst={i === 0}
                  isUsed={isResultUsed ? isResultUsed(result.word) : false}
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

function RhymeWord({ word, isHigh, isFirst, isUsed, onCopy, onCollect }: {
  word: string;
  isHigh: boolean;
  isFirst: boolean;
  isUsed: boolean;
  onCopy: (w: string) => void;
  onCollect: (w: string) => void;
}) {
  const { feedback, flash, flashCopy } = useGestureFeedback();

  // C-43 / DESIGN_PROPOSAL.md §13.3: the primary click collects (a writer browsing
  // forty rhymes wants to keep five — the clipboard only holds one). Copy is the
  // secondary action, reachable via the small hover/focus icon.
  const collect = () => { onCollect(word); flash('collected'); };

  return (
    <span className="rhyme-word-wrap">
      {!isFirst && <span className="rhyme-sep">,</span>}
      <span
        className={`rhyme-word${isHigh ? ' rhyme-word-bold' : ''}${isUsed ? ' rhyme-word-used' : ''}`}
        onClick={collect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(); } }}
        role="button"
        tabIndex={0}
        title="Click to collect · use the copy icon to copy"
        data-testid="tools-result-item"
      >
        {word}
      </span>
      <button
        type="button"
        className="rhyme-copy-btn"
        data-testid="tools-copy-button"
        aria-label={`Copy "${word}" to clipboard`}
        title="Copy"
        onClick={(e) => { e.stopPropagation(); void flashCopy(onCopy(word)); }}
      >
        copy
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
  isUsed: boolean;
  onCopy: () => void;
  onCollect: () => void;
}

function ResultItem({ result, mode, isUsed, onCopy, onCollect }: ResultItemProps) {
  const { feedback, flash, flashCopy } = useGestureFeedback();

  // C-43 / DESIGN_PROPOSAL.md §13.3: the primary click collects; copy is secondary.
  const collect = () => { onCollect(); flash('collected'); };

  return (
    <div
      className={`tools-result-item${isUsed ? ' tools-result-item-used' : ''}`}
      onClick={collect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(); } }}
      role="button"
      tabIndex={0}
      data-testid="tools-result-item"
      title="Click to collect · use the copy button to copy"
    >
      <div className="tools-result-row">
        <div className="tools-result-word">{result.word}</div>
        <button
          type="button"
          className="tools-copy-button"
          data-testid="tools-copy-button"
          aria-label={`Copy "${result.word}" to clipboard`}
          title="Copy"
          onClick={(e) => { e.stopPropagation(); void flashCopy(onCopy()); }}
        >
          copy
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
