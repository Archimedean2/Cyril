import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// C-19 (DESIGN_PROPOSAL.md §2): the last hardcoded colours in editor.css —
// four danger-red hex values in the chord/alternate delete states, and one
// rgba(74,158,255,…) selection tint — must resolve to tokens. The existing
// convention of `var(--token, #fallback)` is fine (the literal only ever
// renders if the token is undefined); a *bare* hex/rgba used directly as a
// property value is not.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.resolve(__dirname, '../../../src/components/editor/editor.css');

/**
 * Removes every `var(...)` call from `css`, including ones whose fallback
 * itself contains parens (e.g. `var(--hover-bg, rgba(0,0,0,0.05))`). A plain
 * regex can't balance nested parens, so this walks the string and matches
 * each `var(`'s closing paren by depth-counting.
 */
function stripVarCalls(css: string): string {
  let result = '';
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('var(', i)) {
      let depth = 1;
      let j = i + 4;
      while (j < css.length && depth > 0) {
        if (css[j] === '(') depth++;
        else if (css[j] === ')') depth--;
        j++;
      }
      i = j; // skip past the whole var(...) call
    } else {
      result += css[i];
      i++;
    }
  }
  return result;
}

describe('editor.css token sweep (C-19)', () => {
  it('T-4.28: no hardcoded hex or rgba colour remains outside var(...) fallbacks', () => {
    const css = readFileSync(CSS_PATH, 'utf8');
    const withoutVarCalls = stripVarCalls(css);

    const hexMatches = withoutVarCalls.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    const rgbaMatches = withoutVarCalls.match(/rgba?\(/g) || [];

    expect(hexMatches).toEqual([]);
    expect(rgbaMatches).toEqual([]);
  });
});
