import * as React from 'react';
import { ToolLookupResponse, ToolResult, ToolMode } from '../../domain/tools/types';

interface ToolsResultsListProps {
  response: ToolLookupResponse | null;
  onCopyResult: (text: string) => void;
}

const RHYME_MODES: ToolMode[] = ['rhyme-exact', 'rhyme-near'];

export function ToolsResultsList({ response, onCopyResult }: ToolsResultsListProps) {
  if (!response) {
    return (
      <div className="tools-results-empty" data-testid="tools-results-empty">
        <p>Search for a word to see results</p>
      </div>
    );
  }

  if (response.loading) {
    return (
      <div className="tools-results-loading" data-testid="tools-results-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="tools-results-error" data-testid="tools-results-error">
        <p>{response.error}</p>
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

  if (isRhymeMode) {
    return (
      <RhymeResultsList
        results={response.results}
        onCopy={onCopyResult}
      />
    );
  }

  return (
    <div className="tools-results-list" data-testid="tools-results-list">
      {response.results.map((result, index) => (
        <ResultItem
          key={`${result.word}-${index}`}
          result={result}
          mode={response.mode}
          isHighRelevance={false}
          onCopy={() => onCopyResult(result.word)}
        />
      ))}
    </div>
  );
}

/** Groups rhyme results by syllable count and renders them with bold high-relevance words */
function RhymeResultsList({ results, onCopy }: { results: ToolResult[]; onCopy: (w: string) => void }) {
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
                <React.Fragment key={`${result.word}-${i}`}>
                  {i > 0 && <span className="rhyme-sep">,</span>}
                  <span
                    className={`rhyme-word${isHigh ? ' rhyme-word-bold' : ''}`}
                    onClick={() => onCopy(result.word)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCopy(result.word); } }}
                    role="button"
                    tabIndex={0}
                    title="Click to copy"
                    data-testid="tools-result-item"
                  >
                    {result.word}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ResultItemProps {
  result: ToolResult;
  mode: string;
  isHighRelevance: boolean;
  onCopy: () => void;
}

function ResultItem({ result, mode, onCopy }: ResultItemProps) {
  return (
    <div
      className="tools-result-item"
      onClick={onCopy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCopy(); } }}
      role="button"
      tabIndex={0}
      data-testid="tools-result-item"
      title="Click to copy"
    >
      <div className="tools-result-word">{result.word}</div>

      {mode === 'dictionary' && result.definition && (
        <div className="tools-result-definition">
          {result.partOfSpeech && (
            <span className="tools-result-pos">{result.partOfSpeech}</span>
          )}
          <span className="tools-result-def-text">{result.definition}</span>
        </div>
      )}
    </div>
  );
}
