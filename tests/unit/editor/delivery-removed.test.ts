import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// C-10 (DESIGN_PROPOSAL.md §3.4): the `delivery` (sung | spoken) lyricLine
// attribute was cut entirely — it only ever italicised "spoken" lines, was
// opaque in the UI, and was redundant with stage directions. This test
// guards the removal itself: no source file may reintroduce `delivery` /
// `DeliveryMode`, and that necessarily includes the "Delivery" toolbar
// button (DraftToolbar.tsx), which would otherwise trip the same grep.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, '../../../src');

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

// migration.ts is the one legitimate exception: it is the removal mechanism
// itself, actively stripping a leftover `delivery` attribute from projects
// saved before C-10 (a silent no-op — see T-4.27). Referencing the literal
// string there is required, not a reintroduction of the feature.
const ALLOWED_REFERENCES = new Set(['domain/project/migration.ts']);

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      collectSourceFiles(full, out);
    } else if (CODE_EXTENSIONS.has(path.extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

describe('Delivery feature removal (C-10)', () => {
  it('T-4.26: no delivery/DeliveryMode reference remains anywhere in src/, and the Delivery control is gone', () => {
    const offenders: string[] = [];
    const deliveryWordRe = /\bdelivery\b/i;
    const deliveryModeRe = /\bDeliveryMode\b/;

    for (const file of collectSourceFiles(SRC_ROOT)) {
      const relative = path.relative(SRC_ROOT, file);
      if (ALLOWED_REFERENCES.has(relative)) continue;
      const content = readFileSync(file, 'utf8');
      if (deliveryWordRe.test(content) || deliveryModeRe.test(content)) {
        offenders.push(relative);
      }
    }

    expect(offenders).toEqual([]);
  });
});
