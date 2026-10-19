// Subsets the app's two typefaces to exactly the characters the trip uses. Every string the app
// shows is known at build time (the plan in data/ plus the app's own copy in src/), so one small
// file per weight replaces ~480 unicode-range slices. Characters outside it (a rare kanji in a
// nearby-place name) fall back to the phone's own Japanese font. Re-run when the plan changes:
// `npm run fonts` (it builds, subsets, then builds again).
import { execFileSync } from 'node:child_process';
import subsetFont from 'subset-font';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cache = join(root, 'node_modules/.cache/fonts');
const out = join(root, 'src/fonts');
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
// Japanese is set in the regular weight (names, readings), in its own file that loads only where
// Japanese shows; the heavier weights carry Latin only and
// leave the odd bold kanji to the system font; the display face draws numerals and the trip
// mark.
const FACES = [
  { file: 'zen-kaku-400', src: `${GF}/zenkakugothicnew/ZenKakuGothicNew-Regular.ttf`, set: 'latin' },
  { file: 'zen-kaku-400-ja', src: `${GF}/zenkakugothicnew/ZenKakuGothicNew-Regular.ttf`, set: 'ja' },
  { file: 'zen-kaku-500', src: `${GF}/zenkakugothicnew/ZenKakuGothicNew-Medium.ttf`, set: 'latin' },
  { file: 'zen-kaku-700', src: `${GF}/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf`, set: 'latin' },
  { file: 'dela-gothic-one-400', src: `${GF}/delagothicone/DelaGothicOne-Regular.ttf`, set: 'display' },
];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === 'research' || f === 'fonts' ? [] : walk(p)) : [p];
  });
}

// What the app shows: the built trip data (dist/app-data.json, so run a build first) and its own copy.
const data = join(root, 'dist/app-data.json');
if (!existsSync(data)) throw new Error('Build first: npm run build');
const files = [data, ...['src/app', 'src/pages', 'src/layouts'].flatMap((d) => walk(join(root, d))).filter((f) => /\.(astro|ts|svelte)$/.test(f))];
const text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
// Letters, digits, punctuation and symbols in any script; emoji are left to the system.
const used = new Set(text.match(/[\p{L}\p{N}\p{P}\p{Sm}\p{Sc}\p{Sk}\p{Zs}°№→←↑↓↗⇄・]/gu));
for (const c of ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?.,:;/()[]-+&\'"·…–—%#@*=<>_~') used.add(c);
const LATIN = /[\p{Script=Latin}\p{N}\p{P}\p{Sm}\p{Sc}\p{Sk}\p{Zs}°→←↑↓↗⇄]/u;
const latin = [...used].filter((c) => LATIN.test(c) && !/[\u3000-\u303f\uff00-\uffef]/.test(c)).join('');
const trip = JSON.parse(readFileSync(data, 'utf8'));
const display = ' 0123456789:–-·¥,.%' + '八人の旅' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ja = [...used].filter((c) => !latin.includes(c)).join('');
const SETS = { latin, ja, display };

mkdirSync(cache, { recursive: true });
mkdirSync(out, { recursive: true });
for (const f of FACES) {
  const ttf = join(cache, f.src.split('/').pop());
  if (!existsSync(ttf)) execFileSync('curl', ['-fsSL', '-o', ttf, f.src]);
  const woff2 = await subsetFont(readFileSync(ttf), SETS[f.set], { targetFormat: 'woff2' });
  writeFileSync(join(out, `${f.file}.woff2`), woff2);
  console.log(`${f.file}.woff2  ${(woff2.length / 1024).toFixed(0)} KB`);
}
for (const [dir, name] of [['zenkakugothicnew', 'OFL-zen-kaku.txt'], ['delagothicone', 'OFL-dela-gothic.txt']]) {
  const p = join(out, name);
  if (!existsSync(p)) execFileSync('curl', ['-fsSL', '-o', p, `${GF}/${dir}/OFL.txt`]);
}
writeFileSync(join(out, 'subset.txt'), `${[...used].filter((c) => /[^\x00-\x7f]/.test(c)).sort().join('')}\n`);
console.log(`Subset ${used.size} characters into ${FACES.length} faces → src/fonts/`);
