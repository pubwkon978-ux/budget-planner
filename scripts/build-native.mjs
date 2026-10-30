// Builds the web layer for the Android app from the SAME index.html used on GitHub Pages.
//  - index.html stays in the repo root (so the Pages site never 404s)
//  - this script writes ./dist (build-time only, git-ignored)
//  - Firebase CDN imports are bundled locally so the app works fully offline
//  - the "native" prelude (offline Firestore + native Google sign-in) is injected here only,
//    so the website itself is unchanged and stays online-only
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let html = readFileSync('index.html', 'utf8');

// 1) find the main module script (the one that imports Firebase from the CDN)
const re = /<script type="module">([\s\S]*?)<\/script>/;
const m = html.match(re);
if (!m) throw new Error('module <script> not found in index.html');
let code = m[1];

// 2) CDN urls -> npm package entry points (firebase-app.js -> firebase/app ...)
code = code.replace(/https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-([a-z-]+)\.js/g, 'firebase/$1');

// 3) native prelude: runs before the app code, exposes the native bits on window
const build_ = { n: parseInt(process.env.GITHUB_RUN_NUMBER || '0', 10), repo: process.env.GITHUB_REPOSITORY || '' };
const prelude = `
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
window.__NATIVE__ = { isNative: Capacitor.isNativePlatform(), auth: FirebaseAuthentication, updater: CapacitorUpdater, build: ${JSON.stringify(build_)} };
// tells the updater this bundle started fine (otherwise a broken live update rolls back automatically)
try { CapacitorUpdater.notifyAppReady(); } catch (e) {}
`;
writeFileSync('.native-entry.mjs', prelude + '\n' + code);

await build({
  entryPoints: ['.native-entry.mjs'],
  bundle: true,
  format: 'esm',
  target: 'chrome100',
  minify: true,
  outfile: `${OUT}/app.js`,
  legalComments: 'none',
  logLevel: 'info',
});
rmSync('.native-entry.mjs');

// 4) html: swap inline script for the bundle, drop PWA bits the app doesn't need
html = html.replace(re, '<script type="module" src="app.js"></script>')
           .replace(/<link rel="manifest"[^>]*>\s*/, '')
           // Capacitor 8 draws edge-to-edge and publishes the insets as CSS variables (native env() is zeroed)
           .replace(/env\(safe-area-inset-(top|right|bottom|left)\s*(?:,\s*[^)]*)?\)/g, 'var(--safe-area-inset-$1,0px)');
writeFileSync(`${OUT}/index.html`, html);

// 5) static files the page uses (icons, guide). Service worker is NOT copied: the app is already offline.
for (const f of ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'guide.html', 'guide']) {
  if (existsSync(f)) cpSync(f, `${OUT}/${f}`, { recursive: true });
}
console.log('native web build ready ->', OUT);
