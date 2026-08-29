/**
 * Character registry domain helpers (C-20).
 *
 * A `Character` is project-level state (`CyrilProject.characters`) that gives
 * a speaker/character identity a stable id, a display name, and a colour
 * drawn from the section-accent family. See `docs/engineering/DATA_MODEL.md`.
 */

import { Character, CharacterColor } from './types';
import { generateId } from './defaults';

/**
 * Auto-assignment order for new characters. Cycles once there are more than
 * five characters in a project.
 */
export const CHARACTER_COLOR_ORDER: CharacterColor[] = ['blue', 'green', 'gold', 'rose', 'violet'];

/** The next colour to auto-assign, given the characters that already exist. */
export function nextCharacterColor(existing: Character[]): CharacterColor {
  return CHARACTER_COLOR_ORDER[existing.length % CHARACTER_COLOR_ORDER.length];
}

/** Case/whitespace-insensitive identity match against an existing registry. */
export function findCharacterByName(characters: Character[], name: string): Character | undefined {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return undefined;
  return characters.find(c => c.name.trim().toLowerCase() === normalized);
}

export function findCharacterById(characters: Character[], id: string | null | undefined): Character | undefined {
  if (!id) return undefined;
  return characters.find(c => c.id === id);
}

/** Creates a new character with an auto-assigned colour. Does not mutate `existing`. */
export function createCharacter(name: string, existing: Character[]): Character {
  return {
    id: generateId('character'),
    name: name.trim(),
    color: nextCharacterColor(existing),
  };
}

/**
 * Resolves the CSS custom property expression for a character's colour —
 * e.g. `var(--section-blue)`. Consumers (editor decorations, export/print)
 * should use this rather than hardcoding the `--section-*` token name.
 */
export function characterColorVar(color: CharacterColor): string {
  return `var(--section-${color})`;
}

/**
 * Resolves the display colour token (e.g. `'blue'`) for a speaker/column
 * given its optional `characterId` link and its literal name text. Prefers
 * the stable `characterId` link; falls back to a case-insensitive name match
 * against the registry (keeps colouring working for content that hasn't been
 * reconciled to a `characterId` yet — see `reconcileSpeakerCharacters` in the
 * editor layer, and `migrateProject` for legacy projects).
 */
export function resolveCharacterColor(
  characters: Character[],
  characterId: string | null | undefined,
  name: string | null | undefined
): CharacterColor | undefined {
  const byId = findCharacterById(characters, characterId);
  if (byId) return byId.color;
  if (!name) return undefined;
  return findCharacterByName(characters, name)?.color;
}
