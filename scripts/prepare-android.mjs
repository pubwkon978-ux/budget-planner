// Runs after `npx cap add android` (in CI). Customises the generated, git-ignored android/ project:
// Google sign-in dependencies, google-services.json, launcher icons, splash colour, version numbers.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const A = 'android';
const RES = `${A}/app/src/main/res`;

// 1) Google sign-in native libraries (plugin flag)
let vars = readFileSync(`${A}/variables.gradle`, 'utf8');
if (!vars.includes('rgcfaIncludeGoogle')) {
  vars = vars.replace(/ext\s*\{/, 'ext {\n    rgcfaIncludeGoogle = true');
  writeFileSync(`${A}/variables.gradle`, vars);
}

// 2) Firebase config for the Android app
if (!existsSync('google-services.json')) {
  console.error('\n❌ google-services.json is missing in the repo root.\n' +
    '   Firebase console → Project settings → Your apps → Android app (com.dilum.budgetplanner) → download google-services.json\n');
  process.exit(1);
}
copyFileSync('google-services.json', `${A}/app/google-services.json`);

// 3) version numbers (every CI run gets a higher versionCode so the APK can update the old one)
const run = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
let g = readFileSync(`${A}/app/build.gradle`, 'utf8');
g = g.replace(/versionCode \d+/, `versionCode ${run}`).replace(/versionName "[^"]*"/, `versionName "1.0.${run}"`);
writeFileSync(`${A}/app/build.gradle`, g);

// 4) launcher icons from icon-512.png
const SIZE = 450;                                        // rounded square inside icon-512.png (no white border)
const rr = Buffer.from(`<svg width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="108" fill="#fff"/></svg>`);
const full = await sharp('icon-512.png').extract({ left: 31, top: 31, width: SIZE, height: SIZE })
  .composite([{ input: rr, blend: 'dest-in' }]).png().toBuffer();   // transparent corners

const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = `${RES}/mipmap-${d}`;
  mkdirSync(dir, { recursive: true });
  const legacy = Math.round(48 * k), canvas = Math.round(108 * k), inner = Math.round(canvas * 0.58);
  await sharp(full).resize(legacy, legacy).png().toFile(`${dir}/ic_launcher.png`);
  const circle = Buffer.from(`<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}" fill="#fff"/></svg>`);
  await sharp(full).resize(legacy, legacy).composite([{ input: circle, blend: 'dest-in' }]).png().toFile(`${dir}/ic_launcher_round.png`);
  const fg = await sharp(full).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fg, gravity: 'center' }]).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
writeFileSync(`${RES}/values/ic_launcher_background.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#060D28</color>\n</resources>\n');

// 5) splash: plain dark background instead of the default Capacitor logo
writeFileSync(`${RES}/values/bp_colors.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="bp_splash">#1B1038</color>\n</resources>\n');
const st = `${RES}/values/styles.xml`;
writeFileSync(st, readFileSync(st, 'utf8').replace('@drawable/splash', '@color/bp_splash'));

console.log('android project customised (version 1.0.' + run + ')');
