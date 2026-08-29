#!/usr/bin/env node
/**
 * status.mjs — stamp the live project state into STATUS.md.
 *
 * STATUS.md is the file you (or an agent) read first after any pause. Half of it is
 * hand-written intent ("what I'm in the middle of"); the other half is generated here
 * so it can never drift from reality — the same principle as FEATURE_COVERAGE.md.
 *
 * Usage:
 *   npm run status           # gates + git + coverage, rewrite the generated block
 *   npm run status -- --e2e  # also run Playwright (slower, ~25s)
 *   npm run status -- --check  # print only, don't write; exit 1 if any gate is red
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATUS_MD = path.join(ROOT, 'STATUS.md');
const BEGIN = '<!-- BEGIN GENERATED — npm run status -->';
const END = '<!-- END GENERATED -->';

const args = process.argv.slice(2);
const withE2e = args.includes('--e2e');
const checkOnly = args.includes('--check');

/** Run a command; return { ok, out }. Never throws. */
function run(cmd, timeout = 600_000) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

function gitLine(cmd, fallback = '—') {
  const r = run(cmd, 15_000);
  return r.ok ? r.out.trim() || fallback : fallback;
}

const mark = (ok) => (ok ? '🟢' : '🔴');

console.log('Running gates — this takes about a minute…\n');

// ---- Gates -----------------------------------------------------------------
const gates = [];

process.stdout.write('  build … ');
const build = run('npm run build');
console.log(build.ok ? 'pass' : 'FAIL');
gates.push({ name: 'Build', cmd: 'npm run build', ok: build.ok, detail: build.ok ? 'tsc + vite clean' : firstError(build.out) });

process.stdout.write('  lint … ');
const lint = run('npm run lint');
const lintWarn = (lint.out.match(/(\d+) warning/) || [])[1];
console.log(lint.ok ? 'pass' : 'FAIL');
gates.push({ name: 'Lint', cmd: 'npm run lint', ok: lint.ok, detail: lint.ok ? `0 errors, ${lintWarn ?? 0} warnings` : firstError(lint.out) });

process.stdout.write('  test … ');
const test = run('npm test');
const testCounts = test.out.match(/Tests\s+(\d+) passed(?:\s*\|\s*(\d+) failed)?\s*\((\d+)\)/);
const testFiles = (test.out.match(/Test Files\s+(\d+) passed/) || [])[1];
console.log(test.ok ? 'pass' : 'FAIL');
gates.push({
  name: 'Unit + integration',
  cmd: 'npm test',
  ok: test.ok,
  detail: testCounts ? `${testCounts[1]}/${testCounts[3]} tests, ${testFiles ?? '?'} files` : firstError(test.out),
});

process.stdout.write('  feature coverage … ');
const feat = run('npm run coverage:features');
const featPct = (feat.out.match(/Feature coverage:\s*([\d.]+%)/) || [])[1];
const featCounts = feat.out.match(/✅ passing (\d+)\s+❌ failing (\d+)\s+⚠️ no test (\d+)\s+🔶 e2e (\d+)/);
console.log(feat.ok ? 'pass' : 'FAIL');
gates.push({
  name: 'Feature coverage',
  cmd: 'npm run coverage:features',
  ok: feat.ok && featCounts?.[2] === '0' && featCounts?.[3] === '0',
  detail: featPct ? `${featPct} — ${featCounts?.[1] ?? '?'} passing, ${featCounts?.[2] ?? '?'} failing, ${featCounts?.[3] ?? '?'} untested, ${featCounts?.[4] ?? '?'} e2e-only` : firstError(feat.out),
});

let e2eRow = { name: 'E2E (Playwright)', cmd: 'npm run test:e2e', ok: null, detail: 'not run — `npm run status -- --e2e`' };
if (withE2e) {
  process.stdout.write('  e2e … ');
  const e2e = run('npx playwright test --reporter=line');
  const e2eCounts = e2e.out.match(/(\d+) passed/);
  const e2eFailed = (e2e.out.match(/(\d+) failed/) || [])[1];
  console.log(e2e.ok ? 'pass' : 'FAIL');
  e2eRow = {
    name: 'E2E (Playwright)',
    cmd: 'npm run test:e2e',
    ok: e2e.ok,
    detail: e2eCounts ? `${e2eCounts[1]} passed${e2eFailed ? `, ${e2eFailed} failed` : ''}` : firstError(e2e.out),
  };
}
gates.push(e2eRow);

function firstError(out) {
  const line = out
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /error|failed|✘|✗/i.test(l) && l.length < 160);
  return line ? '`' + line.replace(/`/g, '') + '`' : 'see command output';
}

// ---- Git -------------------------------------------------------------------
const branch = gitLine('git rev-parse --abbrev-ref HEAD');
const lastCommit = gitLine('git log -1 --format=%s');
const lastCommitDate = gitLine('git log -1 --format=%ci');
const dirty = gitLine('git status --porcelain', '');
const dirtyCount = dirty ? dirty.split('\n').filter(Boolean).length : 0;
const aheadBehind = gitLine('git rev-list --left-right --count @{u}...HEAD 2>/dev/null', '');

// ---- Backlog ---------------------------------------------------------------
let backlogSummary = '_BACKLOG.md not found_';
let backlogNext = '—';
const backlogPath = path.join(ROOT, 'BACKLOG.md');
if (fs.existsSync(backlogPath)) {
  const bl = fs.readFileSync(backlogPath, 'utf8');

  // The queue is a table ordered by an explicit Pri column:
  //   | 20 | C-41 | Item | Lane | ⬜ | Size | Deps | Spec |
  // Priorities are spaced by ten so an item can be slid between two others without
  // renumbering. This ordering — not the row order — is what "next up" means.
  const queue = [...bl.matchAll(/^\|\s*(\d+)\s*\|\s*(C-\d+)\s*\|\s*(.+?)\s*\|[^|]*\|\s*(⬜|✅|🚧[^|]*)\s*\|/gm)]
    .map((m) => ({ pri: Number(m[1]), id: m[2], title: m[3], status: m[4].trim() }))
    .sort((a, b) => a.pri - b.pri);

  const doneList = [...bl.matchAll(/^-\s+\*\*(C-\d+)\*\*/gm)].map((m) => m[1]);
  const blocked = [...bl.matchAll(/^\|\s*(C-\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|\s*(?:changes|expands)/gm)].map((m) => m[1]);

  const claimed = queue.filter((q) => q.status.startsWith('🚧'));
  const open = queue.filter((q) => q.status === '⬜');
  const total = queue.length + doneList.length;

  // Strip markdown emphasis so the table cell reads cleanly.
  const plain = (s) => s.replace(/\*\*/g, '').replace(/`/g, '');
  const nextUp = open.slice(0, 3).map((q) => `${q.id} (${q.pri}) ${plain(q.title)}`);

  backlogSummary =
    `**${doneList.length} of ${total}** done` +
    (claimed.length ? ` · ${claimed.length} in flight (${claimed.map((c) => c.id).join(', ')})` : '') +
    (blocked.length ? ` · ${blocked.length} blocked on you (${blocked.join(', ')})` : '');
  backlogNext = nextUp.length
    ? nextUp.map((n, i) => (i === 0 ? `**${n}**` : n)).join('<br>')
    : '_queue empty_';
}

// ---- Compose ---------------------------------------------------------------
const allGreen = gates.filter((g) => g.ok !== null).every((g) => g.ok);
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

const block = `${BEGIN}
_Last stamped: **${stamp} UTC** · regenerate with \`npm run status\`_

### Gate status — ${allGreen ? '🟢 all green' : '🔴 something is red'}

| Gate | Status | Detail |
|---|:--:|---|
${gates.map((g) => `| \`${g.cmd}\` | ${g.ok === null ? '⚪️' : mark(g.ok)} | ${g.detail} |`).join('\n')}

### Repo

| | |
|---|---|
| Branch | \`${branch}\`${aheadBehind && aheadBehind !== '0\t0' ? ` (${aheadBehind.replace('\t', ' behind / ')} ahead)` : ''} |
| Last commit | ${lastCommit} |
| Committed | ${lastCommitDate} |
| Uncommitted files | ${dirtyCount === 0 ? 'none — clean tree' : `**${dirtyCount}** (\`git status\`)`} |
| Backlog | ${backlogSummary} |
| Next up | ${backlogNext} |
${END}`;

if (checkOnly) {
  console.log('\n' + block);
  process.exit(allGreen ? 0 : 1);
}

if (!fs.existsSync(STATUS_MD)) {
  console.error(`\n${STATUS_MD} not found — create it with a ${BEGIN} / ${END} block.`);
  process.exit(1);
}

const current = fs.readFileSync(STATUS_MD, 'utf8');
if (!current.includes(BEGIN) || !current.includes(END)) {
  console.error(`\nSTATUS.md is missing the generated block markers.\nAdd:\n${BEGIN}\n${END}`);
  process.exit(1);
}

const updated = current.replace(
  new RegExp(`${escapeRe(BEGIN)}[\\s\\S]*?${escapeRe(END)}`),
  () => block,
);
fs.writeFileSync(STATUS_MD, updated);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log(`\n${allGreen ? '🟢 All gates green.' : '🔴 At least one gate is red — see STATUS.md.'}`);
console.log(`Stamped STATUS.md at ${stamp} UTC.\n`);
process.exit(0);
