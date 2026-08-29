import { Character } from '../../domain/project/types';

/**
 * Live state for the C-20 `[[` speaker-name autocomplete: where the
 * in-progress speaker line is (`pos`, the ProseMirror position of the
 * lyricLine node itself), its current text (`query`), and where to render
 * the popover (`left`/`bottom`, from `editor.view.coordsAtPos`).
 */
export interface SpeakerSuggestState {
  pos: number;
  query: string;
  left: number;
  bottom: number;
}

interface SpeakerAutocompleteProps {
  state: SpeakerSuggestState;
  matches: Character[];
  highlightedIndex: number;
  onHover: (index: number) => void;
  onSelect: (character: Character) => void;
}

/**
 * Popover offering registry matches for an in-progress `[[NAME` speaker
 * line — so a typo doesn't silently create a duplicate character (C-20).
 * Purely a picker: it never mutates the doc itself, `onSelect` does.
 */
export function SpeakerAutocomplete({ state, matches, highlightedIndex, onHover, onSelect }: SpeakerAutocompleteProps) {
  const style: React.CSSProperties = {
    position: 'fixed',
    top: state.bottom + 4,
    left: state.left,
    zIndex: 9999,
  };

  return (
    <div
      className="speaker-autocomplete"
      style={style}
      data-testid="speaker-autocomplete"
      // Keep the editor's own selection/focus intact — this popover is
      // navigated via the editor's own keydown handling, never by clicking
      // into it for text entry.
      onMouseDown={e => e.preventDefault()}
    >
      {matches.map((character, index) => (
        <div
          key={character.id}
          className={`speaker-autocomplete-option${index === highlightedIndex ? ' is-highlighted' : ''}`}
          data-testid="speaker-autocomplete-option"
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(character)}
        >
          <span
            className="speaker-autocomplete-swatch"
            style={{ background: `var(--section-${character.color})` }}
            aria-hidden="true"
          />
          {character.name}
        </div>
      ))}
    </div>
  );
}
