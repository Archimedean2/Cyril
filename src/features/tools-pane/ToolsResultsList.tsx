import { ToolLookupResponse, ToolResult } from '../../domain/tools/types';

interface ToolsResultsListProps {
  response: ToolLookupResponse | null;
  onCopyResult: (text: string) => void;
}

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

  return (
    <div className="tools-results-list" data-testid="tools-results-list">
      {response.results.map((result, index) => (
        <ResultItem
          key={`${result.word}-${index}`}
          result={result}
          mode={response.mode}
          onCopy={() => onCopyResult(result.word)}
        />
      ))}
    </div>
  );
}

interface ResultItemProps {
  result: ToolResult;
  mode: string;
  onCopy: () => void;
}

function ResultItem({ result, mode, onCopy }: ResultItemProps) {
  const handleClick = () => {
    onCopy();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCopy();
    }
  };

  return (
    <div
      className="tools-result-item"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
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
      
      {result.score !== undefined && result.score > 0 && (
        <div className="tools-result-score">
          relevance: {Math.round(result.score / 1000)}
        </div>
      )}
    </div>
  );
}
