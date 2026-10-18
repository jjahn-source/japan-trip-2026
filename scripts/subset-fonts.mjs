// Subsets Zen Kaku Gothic New to exactly the Japanese characters this site uses.
// Every Japanese string is known at build time (the TREK export + page copy), so one
// small file per weight replaces ~120 unicode-range slices. Re-run after `npm run sync`
// when the plan gains new Japanese text: `npm run fonts`.
import { execFileSync } from 'node:child_process';
import subsetFont from 'subset-font';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cache = join(root, 'node_modules/.cache/zen-kaku');
const out = join(root, 'src/fonts');
const WEIGHTS = { 500: 'Medium', 700: 'Bold', 900: 'Black' };
const SRC = 'https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = [...walk(join(root, 'data')), ...walk(join(root, 'src')).filter((f) => /\.(astro|ts|css)$/.test(f))];
const text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
const jp = new Set(text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}　-〿ー！-～‐-⁯、-〃]/gu));
// Latin, digits and punctuation that sit inside Japanese runs ("8名", "2F") render in this face too.
const chars = [...jp].join('') + ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!?.,:;/()-+&\'"·…–—';

mkdirSync(cache, { recursive: true });
mkdirSync(out, { recursive: true });
for (const [weight, name] of Object.entries(WEIGHTS)) {
  const ttf = join(cache, `ZenKakuGothicNew-${name}.ttf`);
  if (!existsSync(ttf)) execFileSync('curl', ['-fsSL', '-o', ttf, `${SRC}/ZenKakuGothicNew-${name}.ttf`]);
  const woff2 = await subsetFont(readFileSync(ttf), chars, { targetFormat: 'woff2' });
  writeFileSync(join(out, `zen-kaku-${weight}.woff2`), woff2);
}
const license = join(out, 'OFL.txt');
if (!existsSync(license)) execFileSync('curl', ['-fsSL', '-o', license, `${SRC}/OFL.txt`]);
writeFileSync(join(out, 'subset.txt'), `${[...jp].sort().join('')}\n`);
console.log(`Subset ${jp.size} Japanese characters into ${Object.keys(WEIGHTS).length} weights → src/fonts/`);
