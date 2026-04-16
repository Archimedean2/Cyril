/**
 * Datamuse API provider for rhyme, thesaurus, and dictionary lookups.
 * 
 * Datamuse is a free word-finding query engine with no API key required.
 * https://www.datamuse.com/api/
 * 
 * Query parameters:
 * - rel_rhy: exact rhymes (same final vowel and consonant sounds)
 * - rel_nry: near rhymes (similar but not exact)
 * - ml: means like (synonyms/thesaurus)
 * - rel_ant: antonyms
 * - md=d: definitions (adds definitions to result)
 * - md=p: parts of speech
 * - sl: sounds like
 * - sp: spelled like
 */

import { ToolProvider, ToolMode, ToolResult } from './types';

const DATAMUSE_API_URL = 'https://api.datamuse.com/words';

export class DatamuseProvider implements ToolProvider {
  name = 'datamuse';

  supportsMode(mode: ToolMode): boolean {
    return [
      'rhyme-exact',
      'rhyme-near',
      'thesaurus',
      'dictionary',
      'related'
    ].includes(mode);
  }

  async lookup(term: string, mode: ToolMode): Promise<ToolResult[]> {
    const params = this.buildQueryParams(term, mode);
    if (!params) return [];

    try {
      const response = await fetch(`${DATAMUSE_API_URL}?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.transformResults(data, mode);
    } catch (error) {
      console.error('Datamuse API error:', error);
      throw error;
    }
  }

  private buildQueryParams(term: string, mode: ToolMode): string | null {
    const encodedTerm = encodeURIComponent(term.toLowerCase().trim());

    switch (mode) {
      case 'rhyme-exact':
        // rel_rhy = related rhyme (exact), md=s = syllable count
        return `rel_rhy=${encodedTerm}&md=s&max=200`;
      
      case 'rhyme-near':
        // rel_nry = related near rhyme, md=s = syllable count
        return `rel_nry=${encodedTerm}&md=s&max=200`;
      
      case 'thesaurus':
        // ml = means like (synonyms)
        return `ml=${encodedTerm}&max=50`;
      
      case 'dictionary':
        // sp = spelled like + md=d (metadata definitions) + md=p (parts of speech)
        return `sp=${encodedTerm}&md=d&md=p&max=10`;
      
      case 'related':
        // sl = sounds like (broader relatedness)
        return `sl=${encodedTerm}&max=50`;
      
      default:
        return null;
    }
  }

  private transformResults(data: any[], mode: ToolMode): ToolResult[] {
    if (!Array.isArray(data)) return [];

    return data.map(item => {
      const result: ToolResult = {
        word: item.word,
        score: item.score,
      };

      // Extract definition and part of speech if available
      if (item.defs && item.defs.length > 0) {
        // defs format: "part\tdefinition" or just "definition"
        const defParts = item.defs[0].split('\t');
        if (defParts.length > 1) {
          result.partOfSpeech = defParts[0];
          result.definition = defParts[1];
        } else {
          result.definition = item.defs[0];
        }
      }

      // numSyllables is returned as a top-level field when md=s is requested
      if (typeof item.numSyllables === 'number') {
        result.numSyllables = item.numSyllables;
      }

      // For dictionary mode, extract part of speech from tags
      if (mode === 'dictionary' && item.tags && Array.isArray(item.tags)) {
        const posTag = item.tags.find((t: string) =>
          ['n', 'v', 'adj', 'adv', 'u'].includes(t)
        );
        if (posTag) result.partOfSpeech = posTag;
      }

      return result;
    });
  }
}

/** Singleton instance for app-wide use */
export const datamuseProvider = new DatamuseProvider();
