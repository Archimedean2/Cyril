const d = require('../coverage/coverage-summary.json');
const dirs = {};
Object.entries(d).filter(([k]) => k !== 'total').forEach(([k, v]) => {
  const m = k.match(/src[\\/]([^\\/]+)/);
  if (!m) return;
  const t = m[1];
  if (!dirs[t]) dirs[t] = { lt: 0, lc: 0, ft: 0, fc: 0, bt: 0, bc: 0 };
  dirs[t].lt += v.lines.total;
  dirs[t].lc += v.lines.covered;
  dirs[t].ft += v.functions.total;
  dirs[t].fc += v.functions.covered;
  dirs[t].bt += v.branches.total;
  dirs[t].bc += v.branches.covered;
});
console.log('| Area | Lines | Functions | Branches |');
console.log('|------|-------|-----------|----------|');
Object.keys(dirs).sort().forEach(k => {
  const x = dirs[k];
  const lp = x.lt ? ((x.lc / x.lt) * 100).toFixed(1) : 0;
  const fp = x.ft ? ((x.fc / x.ft) * 100).toFixed(1) : 0;
  const bp = x.bt ? ((x.bc / x.bt) * 100).toFixed(1) : 0;
  console.log('| ' + k + ' | ' + lp + '% | ' + fp + '% | ' + bp + '% |');
});
const t = d.total;
console.log('| **Overall** | **' + t.lines.pct + '%** | **' + t.functions.pct + '%** | **' + t.branches.pct + '%** |');
