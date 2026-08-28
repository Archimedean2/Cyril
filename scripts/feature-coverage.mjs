#!/usr/bin/env node
/**
 * Feature coverage metric for Cyril.
 *
 * Code coverage answers "which lines ran during tests". It says nothing about
 * whether a *feature* actually works. This script answers the more important
 * question: for every acceptance criterion the spec pack claims, is there a
 * real automated test, and does it pass right now?
 *
 * How it works
 * ------------
 * 1. Parse every `tests/specs/stage-*.md` checklist table. Each row is an
 *    acceptance criterion: an ID (T-<stage>.<n>), a human description, a type
 *    (unit | integration | e2e) and the test file that is supposed to cover it.
 * 2. Run the unit/integration suite once with vitest's JSON reporter.
 * 3. Match each criterion to the test(s) whose title contains its ID (the repo
 *    convention is to name tests "T-2.01: ..."), and read their real pass/fail.
 * 4. Emit FEATURE_COVERAGE.md + .feature-cov/feature-coverage.json with an
 *    honest status per criterion:
 *      - passing  : has a matching automated test and it passes
 *      - failing  : has a matching test but it fails
 *      - missing  : criterion is claimed but NO matching test exists (the gap
 *                   between "marked complete" and "actually verified")
 *      - e2e      : covered only by Playwright; not verified by this harness
 *
 * Usage:  node scripts/feature-coverage.mjs   (or: npm run coverage:features)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_DIR = path.join(ROOT, 'tests', 'specs');
const OUT_MD = path.join(ROOT, 'FEATURE_COVERAGE.md');
const OUT_JSON_DIR = path.join(ROOT, '.feature-cov');
// vitest results go to the OS temp dir so we never fight the repo mount perms.
const RESULTS_JSON = path.join(os.tmpdir(), `cyril-vitest-${process.pid}.json`);

const TID_RE = /T-\d+\.\d+[a-z]?/g;

/** Parse all stage-*.md checklist tables into a flat list of criteria. */
function parseSpecs() {
  const criteria = [];
  const files = readdirSync(SPEC_DIR)
    .filter((f) => /^stage-\d+\.md$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

  for (const file of files) {
    const stageNum = parseInt(file.match(/\d+/)[0]);
    const lines = readFileSync(path.join(SPEC_DIR, file), 'utf8').split('\n');
    for (const line of lines) {
      // Match table rows that start with an ID cell like "| T-2.01 |"
      const cells = line.split('|').map((c) => c.trim());
      // cells[0] is empty (leading pipe). Expected: ['', id, desc, type, file, impl, pass, notes...]
      if (cells.length < 5) continue;
      const id = cells[1];
      if (!/^T-\d+\.\d+[a-z]?$/.test(id)) continue;
      criteria.push({
        stage: stageNum,
        id,
        description: cells[2] || '',
        type: (cells[3] || '').toLowerCase(),
        testFile: (cells[4] || '').replace(/`/g, '').trim(),
        claimedImplemented: /x/i.test(cells[5] || ''),
        claimedPassing: /x/i.test(cells[6] || ''),
      });
    }
  }
  return criteria;
}

/** Run vitest once and return a map of T-id -> array of statuses ('passed'|'failed'). */
function runVitestAndCollect() {
  let ran = true;
  try {
    execSync(
      `npx vitest run --reporter=json --outputFile=${JSON.stringify(RESULTS_JSON)}`,
      { cwd: ROOT, stdio: 'ignore', env: { ...process.env, CI: 'true' } },
    );
  } catch {
    // Non-zero exit (a failing test, or the sandbox EPERM-on-cleanup) is fine:
    // the JSON results file is still written. We read it regardless.
    ran = existsSync(RESULTS_JSON);
  }
  if (!existsSync(RESULTS_JSON)) {
    throw new Error(`vitest did not produce results at ${RESULTS_JSON}`);
  }
  const raw = JSON.parse(readFileSync(RESULTS_JSON, 'utf8'));
  const byId = new Map(); // 'T-2.01' -> [{status, file}]
  for (const suite of raw.testResults || []) {
    const file = path.relative(ROOT, suite.name || '');
    for (const a of suite.assertionResults || []) {
      const title = a.title || '';
      // Prefer the IDs named in the individual test title. Only if the title
      // carries none do we fall back to the describe-block path — this avoids a
      // describe header like "(T-2.02, T-2.03, T-2.04)" bleeding its IDs onto
      // every test inside it.
      const describePath = (a.fullName || '').replace(title, '');
      let ids = title.match(TID_RE);
      if (!ids) ids = describePath.match(TID_RE);
      if (!ids) continue;
      for (const id of new Set(ids)) {
        if (!byId.has(id)) byId.set(id, []);
        byId.get(id).push({ status: a.status, file });
      }
    }
  }
  return { byId, ran };
}

function statusFor(criterion, byId) {
  if (criterion.type === 'e2e') return 'e2e';
  const hits = byId.get(criterion.id);
  if (!hits || hits.length === 0) return 'missing';
  return hits.every((h) => h.status === 'passed') ? 'passing' : 'failing';
}

const BADGE = {
  passing: '✅ passing',
  failing: '❌ failing',
  missing: '⚠️ no test',
  e2e: '🔶 e2e (not checked)',
};

function main() {
  const criteria = parseSpecs();
  const { byId } = runVitestAndCollect();

  for (const c of criteria) c.status = statusFor(c, byId);

  const nonE2e = criteria.filter((c) => c.type !== 'e2e');
  const counts = {
    total: criteria.length,
    nonE2e: nonE2e.length,
    passing: criteria.filter((c) => c.status === 'passing').length,
    failing: criteria.filter((c) => c.status === 'failing').length,
    missing: criteria.filter((c) => c.status === 'missing').length,
    e2e: criteria.filter((c) => c.status === 'e2e').length,
  };
  const pct = counts.nonE2e ? ((counts.passing / counts.nonE2e) * 100).toFixed(1) : '0.0';

  // ---- Markdown report ----
  const now = new Date().toISOString().slice(0, 10);
  let md = `# Cyril — Feature Coverage\n\n`;
  md += `_Generated by \`scripts/feature-coverage.mjs\` on ${now}. Do not edit by hand._\n\n`;
  md += `**Feature coverage: ${pct}%** — ${counts.passing} of ${counts.nonE2e} verifiable acceptance criteria have a passing automated test.\n\n`;
  md += `This is a different, stricter number than code coverage. It measures whether the product's *claimed* features are actually demonstrated by a passing test — not just whether lines executed.\n\n`;
  md += `| Status | Count | Meaning |\n|---|---|---|\n`;
  md += `| ✅ passing | ${counts.passing} | Has a matching automated test, passing now |\n`;
  md += `| ❌ failing | ${counts.failing} | Has a matching test, currently failing |\n`;
  md += `| ⚠️ no test | ${counts.missing} | Claimed criterion with **no** matching automated test |\n`;
  md += `| 🔶 e2e | ${counts.e2e} | Covered only by Playwright; not verified by this harness |\n`;
  md += `| **total** | ${counts.total} | |\n\n`;

  // Per-stage rollup
  md += `## Per-stage rollup\n\n`;
  md += `| Stage | Criteria | ✅ | ❌ | ⚠️ | 🔶 | Verified % (non-e2e) |\n|---|---|---|---|---|---|---|\n`;
  const stages = [...new Set(criteria.map((c) => c.stage))].sort((a, b) => a - b);
  for (const s of stages) {
    const cs = criteria.filter((c) => c.stage === s);
    const csNon = cs.filter((c) => c.type !== 'e2e');
    const p = cs.filter((c) => c.status === 'passing').length;
    const f = cs.filter((c) => c.status === 'failing').length;
    const m = cs.filter((c) => c.status === 'missing').length;
    const e = cs.filter((c) => c.status === 'e2e').length;
    const sp = csNon.length ? ((p / csNon.length) * 100).toFixed(0) : '—';
    md += `| ${s} | ${cs.length} | ${p} | ${f} | ${m} | ${e} | ${sp}% |\n`;
  }
  md += `\n`;

  // Detail per stage
  md += `## Detail\n\n`;
  for (const s of stages) {
    md += `### Stage ${s}\n\n`;
    md += `| ID | Criterion | Type | Test file | Status |\n|---|---|---|---|---|\n`;
    for (const c of criteria.filter((c) => c.stage === s)) {
      const desc = c.description.replace(/\|/g, '\\|');
      md += `| ${c.id} | ${desc} | ${c.type} | \`${c.testFile}\` | ${BADGE[c.status]} |\n`;
    }
    md += `\n`;
  }

  writeFileSync(OUT_MD, md);

  if (!existsSync(OUT_JSON_DIR)) mkdirSync(OUT_JSON_DIR, { recursive: true });
  writeFileSync(
    path.join(OUT_JSON_DIR, 'feature-coverage.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), counts, pct: Number(pct), criteria }, null, 2),
  );

  // ---- Console summary ----
  console.log(`\nFeature coverage: ${pct}%  (${counts.passing}/${counts.nonE2e} non-e2e criteria passing)`);
  console.log(`  ✅ passing ${counts.passing}   ❌ failing ${counts.failing}   ⚠️ no test ${counts.missing}   🔶 e2e ${counts.e2e}`);
  console.log(`Report: FEATURE_COVERAGE.md\n`);
}

main();
