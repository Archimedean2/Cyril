import { useState } from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { Character, CharacterColor } from '../../domain/project/types';
import { CHARACTER_COLOR_ORDER, createCharacter } from '../../domain/project/characters';
import './CharacterRegistry.css';

/**
 * The character/speaker registry (C-20) — lives in the Structure workspace.
 * A small list of the characters in the song, each with a name and a colour
 * auto-assigned from the section-accent family; the writer can rename and
 * recolour any entry here. Every speaker line/column across every draft
 * that links to a character (via `characterId`) picks up changes made here
 * immediately, in both the editor and export/print.
 */
export function CharacterRegistry() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const addCharacter = useProjectStore((s) => s.addCharacter);
  const renameCharacter = useProjectStore((s) => s.renameCharacter);
  const recolorCharacter = useProjectStore((s) => s.recolorCharacter);
  const [openSwatchFor, setOpenSwatchFor] = useState<string | null>(null);

  const characters: Character[] = currentProject?.project.characters ?? [];

  if (!currentProject) return null;

  const handleAdd = () => {
    const created = createCharacter('New Character', characters);
    addCharacter(created);
  };

  return (
    <div className="character-registry" data-testid="character-registry">
      <h3 className="character-registry-title">Characters</h3>
      <ul className="character-registry-list">
        {characters.map((character) => (
          <li key={character.id} className="character-registry-row" data-testid="character-registry-row">
            <div className="character-registry-swatch-wrap">
              <button
                type="button"
                className="character-registry-swatch"
                style={{ background: `var(--section-${character.color})` }}
                aria-label={`Change ${character.name}'s colour`}
                data-testid="character-registry-swatch"
                onClick={() => setOpenSwatchFor(openSwatchFor === character.id ? null : character.id)}
              />
              {openSwatchFor === character.id && (
                <div className="character-registry-swatch-picker" data-testid="character-registry-swatch-picker">
                  {CHARACTER_COLOR_ORDER.map((color: CharacterColor) => (
                    <button
                      key={color}
                      type="button"
                      className={`character-registry-swatch-option${color === character.color ? ' is-selected' : ''}`}
                      style={{ background: `var(--section-${color})` }}
                      aria-label={color}
                      data-testid={`character-registry-swatch-option-${color}`}
                      onClick={() => {
                        recolorCharacter(character.id, color);
                        setOpenSwatchFor(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              className="character-registry-name-input"
              value={character.name}
              data-testid="character-registry-name-input"
              onChange={(e) => renameCharacter(character.id, e.target.value)}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="character-registry-add-btn"
        data-testid="character-registry-add-btn"
        onClick={handleAdd}
      >
        + Add character
      </button>
    </div>
  );
}
