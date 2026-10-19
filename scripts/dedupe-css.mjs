// Astro integration: after the build, drop a page's stylesheet when every rule in it is already in
// another stylesheet on the same page. The pre-rendered copy of the app and the live app (see
// layouts/App.astro) each get the same component styles from the build; without this a phone would
// download ~85 KB of render-blocking CSS twice. Files no page links any more are deleted.
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p))); else out.push(p);
  }
  return out;
}
const rules = (css) => new Set(css.split('}').map((r) => r.trim()).filter(Boolean));

export function dedupeCss() {
  return {
    name: 'dedupe-css',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await walk(root);
        const sets = new Map();
        const ruleSet = async (href) => {
          if (!sets.has(href)) sets.set(href, rules(await readFile(join(root, href.replace(/^\//, '')), 'utf8').catch(() => '')));
          return sets.get(href);
        };
        const LINK = /<link rel="stylesheet" href="([^"]+\.css)"\s*\/?>/g;
        const used = new Set();
        let dropped = 0;
        for (const f of files.filter((x) => x.endsWith('.html'))) {
          let html = await readFile(f, 'utf8');
          const hrefs = [...html.matchAll(LINK)].map((m) => m[1]);
          const drop = new Set();
          for (const a of hrefs) {
            const A = await ruleSet(a);
            for (const b of hrefs) {
              if (a === b || drop.has(b)) continue;
              const B = await ruleSet(b);
              if (A.size && B.size >= A.size && [...A].every((r) => B.has(r))) { drop.add(a); break; }
            }
          }
          if (drop.size) {
            html = html.replace(LINK, (m, href) => (drop.has(href) ? '' : m));
            await writeFile(f, html);
            dropped += drop.size;
          }
          for (const h of hrefs) if (!drop.has(h)) used.add(h);
        }
        // Delete stylesheets nothing links or imports any more.
        const js = (await Promise.all(files.filter((x) => x.endsWith('.js')).map((x) => readFile(x, 'utf8')))).join('\n');
        for (const href of sets.keys()) {
          const name = href.split('/').pop();
          if (!used.has(href) && !js.includes(name)) await unlink(join(root, href.replace(/^\//, ''))).catch(() => {});
        }
        logger.info(`dropped ${dropped} duplicate stylesheet link(s)`);
      },
    },
  };
}
