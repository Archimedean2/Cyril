#!/usr/bin/env node
/**
 * make-launcher.mjs — build a macOS .app that opens Cyril from the Desktop.
 *
 *   npm run launcher            # writes ~/Desktop/Cyril.app
 *   npm run launcher -- --to /Applications
 *
 * The bundle is a thin wrapper around this repo: on launch it rebuilds if any
 * source file is newer than `dist/`, serves `dist/` locally, and opens it in
 * Chrome as an app window (no tabs, no address bar).
 *
 * Why a local server rather than opening dist/index.html directly: Cyril stores
 * projects through the File System Access API, which browsers only expose in a
 * secure context. `http://localhost` counts as one; `file://` does not — from a
 * file:// page the app could not save at all.
 *
 * The icon is rendered from the app's own quill mark so the two never drift.
 */

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const destDir = args.includes('--to') ? args[args.indexOf('--to') + 1] : path.join(os.homedir(), 'Desktop');
const APP = path.join(destDir, 'Cyril.app');
const PORT = 4180; // deliberately not 4173 — that is Playwright's webServer port

if (process.platform !== 'darwin') {
  console.error('This launcher builds a macOS .app bundle; nothing to do on ' + process.platform + '.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Icon, rendered from the app's own mark
// ---------------------------------------------------------------------------
const C = { tile: '#efe8db', border: '#ddd3c2', ink: '#2c2925', accent: '#5c7196' };

/** The quill from src/components/brand/CyrilLogo.tsx, as a standalone document. */
const iconHtml = (px) => `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:transparent}
  .tile{width:${px}px;height:${px}px;box-sizing:border-box;
        background:${C.tile};border:${Math.max(1, px * 0.008)}px solid ${C.border};
        border-radius:${px * 0.23}px;display:flex;align-items:center;justify-content:center}
</style>
<div class="tile">
  <svg width="${px * 0.56}" height="${px * 0.61}" viewBox="0 0 44 48">
    <path d="M35 7 C24 11 15 22 11 36 L8 43 C10 39 13 35 17 32 C25 26 32 16 36 9 C37 7 36 6 35 7 Z" fill="${C.ink}"/>
    <path d="M33 11 C25 17 18 26 12 37" fill="none" stroke="${C.tile}" stroke-width="1" stroke-linecap="round"/>
    <path d="M30 15 L34 13 M25.5 21 L30 19 M21 27.5 L25.5 25.5 M16.5 34 L21 32.5" stroke="${C.tile}" stroke-width="0.9" stroke-linecap="round"/>
    <circle cx="8" cy="43.5" r="2" fill="${C.accent}"/>
  </svg>
</div>`;

// macOS wants each size at 1x and 2x.
const ICON_SIZES = [16, 32, 128, 256, 512];

async function buildIcns(outFile) {
  const { chromium } = await import('@playwright/test');
  const iconset = path.join(os.tmpdir(), `cyril-${Date.now()}.iconset`);
  fs.mkdirSync(iconset, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const size of ICON_SIZES) {
      for (const scale of [1, 2]) {
        const px = size * scale;
        const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
        await page.setContent(iconHtml(px));
        const name = scale === 1 ? `icon_${size}x${size}.png` : `icon_${size}x${size}@2x.png`;
        await page.screenshot({ path: path.join(iconset, name), omitBackground: true });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', outFile]);
  fs.rmSync(iconset, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// 2. The launch script that lives inside the bundle
// ---------------------------------------------------------------------------
//
// A GUI-launched app does NOT inherit your shell PATH — it gets a minimal one,
// so `node` and `npm` are simply missing unless we put them back. That is the
// single most common reason a bundle like this works from a terminal and fails
// from the Dock, so the PATH below is explicit and the failure is reported in a
// dialog rather than to a console nobody is watching.
const launchScript = `#!/bin/bash
set -uo pipefail

REPO="${ROOT}"
PORT=${PORT}
URL="http://localhost:\${PORT}"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:\$PATH"

die() {
  osascript -e "display dialog \\"Cyril could not start.\\n\\n\$1\\" with title \\"Cyril\\" buttons {\\"OK\\"} default button 1 with icon caution" >/dev/null 2>&1
  exit 1
}

cd "\$REPO" 2>/dev/null || die "The project folder has moved.\\n\\nExpected it at:\\n\$REPO\\n\\nRe-run 'npm run launcher' from the new location."
command -v node >/dev/null 2>&1 || die "Node was not found.\\n\\nLooked in /opt/homebrew/bin and /usr/local/bin."

# Rebuild only when something actually changed. A full build is a few seconds,
# but doing it on every launch would make opening the app feel sluggish.
needs_build=0
if [ ! -f dist/index.html ]; then
  needs_build=1
elif [ -n "\$(find src index.html vite.config.ts package.json -newer dist/index.html 2>/dev/null | head -1)" ]; then
  needs_build=1
fi

if [ "\$needs_build" = "1" ]; then
  BUILD_LOG="\$(mktemp)"
  if ! npm run build >"\$BUILD_LOG" 2>&1; then
    die "The build failed.\\n\\n\$(tail -6 "\$BUILD_LOG" | sed 's/\\"/\\\\"/g')\\n\\nFull log: \$BUILD_LOG"
  fi
  rm -f "\$BUILD_LOG"
fi

# Reuse a server that is already up, so a second launch is instant and we never
# leave two servers fighting over the port.
if ! curl -sf --max-time 1 "\$URL" >/dev/null 2>&1; then
  nohup npx vite preview --port "\$PORT" --strictPort >/tmp/cyril-preview.log 2>&1 &
  for _ in \$(seq 1 40); do
    curl -sf --max-time 1 "\$URL" >/dev/null 2>&1 && break
    sleep 0.25
  done
  curl -sf --max-time 1 "\$URL" >/dev/null 2>&1 || die "The local server did not start.\\n\\nSee /tmp/cyril-preview.log"
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "\$CHROME" ]; then
  # --app gives a clean window with no tab strip or address bar. The separate
  # user-data-dir keeps Cyril's file-permission grants out of your normal
  # profile, so it behaves like an app rather than a tab.
  "\$CHROME" --app="\$URL" --user-data-dir="\$HOME/Library/Application Support/Cyril/chrome" >/dev/null 2>&1 &
else
  # Safari and Firefox lack the File System Access API, so saving to a .cyril
  # file will not work. Say so rather than opening a half-broken app silently.
  osascript -e 'display dialog "Google Chrome was not found.\\n\\nCyril will open in your default browser, but saving to a file needs Chrome — other browsers do not support the File System Access API." with title "Cyril" buttons {"Open anyway", "Cancel"} default button 1' >/dev/null 2>&1 || exit 0
  open "\$URL"
fi
`;

// ---------------------------------------------------------------------------
// 3. Assemble the bundle
// ---------------------------------------------------------------------------
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Cyril</string>
  <key>CFBundleDisplayName</key><string>Cyril</string>
  <key>CFBundleIdentifier</key><string>com.cyril.launcher</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleExecutable</key><string>Cyril</string>
  <key>CFBundleIconFile</key><string>Cyril</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
`;

console.log(`Building ${APP}…`);
fs.rmSync(APP, { recursive: true, force: true });
fs.mkdirSync(path.join(APP, 'Contents', 'MacOS'), { recursive: true });
fs.mkdirSync(path.join(APP, 'Contents', 'Resources'), { recursive: true });

fs.writeFileSync(path.join(APP, 'Contents', 'Info.plist'), plist);
const exe = path.join(APP, 'Contents', 'MacOS', 'Cyril');
fs.writeFileSync(exe, launchScript);
fs.chmodSync(exe, 0o755);

console.log('  rendering the icon from the app’s own quill mark…');
await buildIcns(path.join(APP, 'Contents', 'Resources', 'Cyril.icns'));

// Tell Finder the bundle changed, or it will keep showing a stale/generic icon.
try {
  execSync(`touch "${APP}"`);
  execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${APP}"`, { stdio: 'ignore' });
} catch {
  // Purely cosmetic; a logout or a Finder restart achieves the same thing.
}

console.log(`\n✓ ${APP}`);
console.log(`  Double-click it. It rebuilds if the source changed, serves dist/ on :${PORT},`);
console.log(`  and opens Chrome as an app window.\n`);
