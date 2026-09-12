/**
 * C-41 — "double-click a word in the lyric to look it up"
 * (`docs/product/DESIGN_PROPOSAL.md` §13.1).
 *
 * The channel between the editor (which knows what the writer just
 * double-clicked) and the Tools rail (which knows how to look a word up).
 * Deliberately a *request*, not a search: the rail owns mode, filters and the
 * provider call, so the editor never has to know any of that.
 *
 * Why a nonce rather than just a term: looking up the same word twice in a row
 * is an ordinary thing to do (you double-clicked "left", edited, double-clicked
 * it again). A bare `term: string` would be an unchanged value the second time
 * and the rail would not react. The nonce makes every request distinct.
 *
 * The preference lives here and NOT in `.cyril`: it is a property of how this
 * person likes to work, not of the song. `docs/engineering/DATA_MODEL.md` is not
 * touched, per `CLAUDE.md`'s rule against casual schema drift.
 */
import { create } from 'zustand';

/** localStorage key for the double-click preference. */
export const LOOKUP_PREF_KEY = 'cyril.lookupOnDoubleClick';

/**
 * localStorage throws rather than degrades in a private window, a blocked-cookies
 * context, or an embedded webview — the same hazard `IndexedDBToolCacheStore` hit
 * (see `docs/engineering/EDGE_CASES.md` §8). A preference is never worth an
 * exception, so both directions swallow and fall back to the default.
 */
function readEnabledPref(): boolean {
  try {
    return window.localStorage.getItem(LOOKUP_PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writeEnabledPref(enabled: boolean): void {
  try {
    window.localStorage.setItem(LOOKUP_PREF_KEY, enabled ? 'on' : 'off');
  } catch {
    /* preference is best-effort; the session still honours the in-memory value */
  }
}

export interface LookupRequest {
  /** The word to look up — always trimmed and always a single word. */
  term: string;
  /** Distinguishes consecutive requests for the same word. See the module doc. */
  nonce: number;
}

interface WordLookupStore {
  /** §13.1: "A setting disables the behaviour; with it off, double-click only selects." */
  enabled: boolean;
  /** The most recent lookup request, or `null` if none has been made this session. */
  request: LookupRequest | null;
  setEnabled(enabled: boolean): void;
  /**
   * Ask the rail to look up a word. Returns whether a request was actually
   * raised — `false` when the preference is off, or when the caller had nothing
   * to look up (no word under the caret, whitespace, a multi-word selection).
   * Never throws: callers are DOM event handlers.
   */
  requestLookup(word: string | null | undefined): boolean;
}

export const useWordLookupStore = create<WordLookupStore>((set, get) => ({
  enabled: readEnabledPref(),
  request: null,

  setEnabled(enabled) {
    writeEnabledPref(enabled);
    set({ enabled });
  },

  requestLookup(word) {
    if (!get().enabled) return false;
    const term = word?.trim();
    // A term containing whitespace is a multi-word selection — §13.1 explicitly
    // does not look those up (the rail takes one word).
    if (!term || /\s/.test(term)) return false;

    set({ request: { term, nonce: (get().request?.nonce ?? 0) + 1 } });
    return true;
  },
}));
