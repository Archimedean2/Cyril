import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeakerAutocomplete, SpeakerSuggestState } from '../../../src/components/editor/SpeakerAutocomplete';
import { Character } from '../../../src/domain/project/types';

const STATE: SpeakerSuggestState = { pos: 0, query: 'JAC', left: 0, bottom: 0 };
const MATCHES: Character[] = [
  { id: 'char_jack', name: 'JACK', color: 'blue' },
  { id: 'char_jacinta', name: 'JACINTA', color: 'gold' },
];

describe('T-4.32: SpeakerAutocomplete', () => {
  it('renders every registry match with its colour swatch', () => {
    render(<SpeakerAutocomplete state={STATE} matches={MATCHES} highlightedIndex={0} onHover={vi.fn()} onSelect={vi.fn()} />);
    const options = screen.getAllByTestId('speaker-autocomplete-option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('JACK');
    expect(options[1]).toHaveTextContent('JACINTA');
  });

  it('clicking a match calls onSelect with that exact character (never fabricating a new one)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SpeakerAutocomplete state={STATE} matches={MATCHES} highlightedIndex={0} onHover={vi.fn()} onSelect={onSelect} />);

    await user.click(screen.getAllByTestId('speaker-autocomplete-option')[1]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(MATCHES[1]);
  });

  it('marks the highlighted option and calls onHover on mouse enter', async () => {
    const user = userEvent.setup();
    const onHover = vi.fn();
    render(<SpeakerAutocomplete state={STATE} matches={MATCHES} highlightedIndex={0} onHover={onHover} onSelect={vi.fn()} />);

    const options = screen.getAllByTestId('speaker-autocomplete-option');
    expect(options[0].className).toContain('is-highlighted');
    expect(options[1].className).not.toContain('is-highlighted');

    await user.hover(options[1]);
    expect(onHover).toHaveBeenCalledWith(1);
  });
});
