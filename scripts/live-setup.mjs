// Sets up the live layer (worker/, wrangler.jsonc).
//   npm run live:setup             local: push keys in .dev.vars for `npm run live:dev`
//   npm run live:setup -- --remote Cloudflare: creates the D1 database, publishes the site and Worker,
//                                  and stores a separate push key pair as secrets (once: new keys would
//                                  switch off every phone's alerts). Needs `npx wrangler login` first.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { generateVapid } = await import('../worker/push.ts');
const root = new URL('..', import.meta.url).pathname;
const wrangler = (...args) => execFileSync('npx', ['wrangler', ...args], { cwd: root, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });

if (!process.argv.includes('--remote')) {
  const file = join(root, '.dev.vars');
  if (existsSync(file)) { console.log('.dev.vars already exists: keeping its push keys.'); process.exit(0); }
  const k = await generateVapid();
  writeFileSync(file, `# Local secrets for \`npm run live:dev\` (never committed)\nDEV=1\nVAPID_PUBLIC_KEY=${k.publicKey}\nVAPID_PRIVATE_KEY=${k.privateKey}\nVAPID_SUBJECT=https://localhost/\n`);
  console.log('Wrote .dev.vars with a local push key pair. Next: npm run live:dev');
  process.exit(0);
}

// 1. The database, once.
const cfgFile = join(root, 'wrangler.jsonc');
let cfg = readFileSync(cfgFile, 'utf8');
if (cfg.includes('"database_id": "local-only"')) {
  const out = wrangler('d1', 'create', 'japan-plan-c');
  const id = out.match(/"database_id":\s*"([0-9a-f-]{36})"/)?.[1] ?? out.match(/database_id\s*=\s*"([0-9a-f-]{36})"/)?.[1];
  if (!id) { console.error(out); throw new Error('Could not read the new database id above; paste it into wrangler.jsonc'); }
  cfg = cfg.replace('"database_id": "local-only"', `"database_id": "${id}"`);
  writeFileSync(cfgFile, cfg);
  console.log(`Created D1 database ${id}`);
}
// 2. Build, tables, publish.
execFileSync('npx', ['astro', 'build'], { cwd: root, stdio: 'inherit' });
wrangler('d1', 'migrations', 'apply', 'japan-plan-c', '--remote');
let deployed;
try { deployed = wrangler('deploy'); }
catch (e) {
  // Wrangler asks questions it can't ask here (its output is read by this script), such as registering
  // the account's workers.dev address; it then answers no and stops.
  if (/workers\.dev subdomain|registration declined/.test(`${e.stdout}${e.message}`)) {
    console.error('\nThis Cloudflare account has no workers.dev address yet. Open https://dash.cloudflare.com/?to=/:account/workers-and-pages once (it offers one), then run this again.');
    process.exit(1);
  }
  throw e;
}
const url = deployed.match(/https:\/\/[\w.-]+\.workers\.dev/)?.[0];
console.log(deployed.trim().split('\n').slice(-6).join('\n'));
// 3. Push keys, once.
if (/VAPID_PRIVATE_KEY/.test(wrangler('secret', 'list'))) console.log('Push keys already set: kept.');
else {
  const k = await generateVapid();
  const dir = mkdtempSync(join(tmpdir(), 'jt-'));
  const f = join(dir, 'secrets.json');
  writeFileSync(f, JSON.stringify({ VAPID_PUBLIC_KEY: k.publicKey, VAPID_PRIVATE_KEY: k.privateKey, VAPID_SUBJECT: url ?? 'https://workers.dev/' }), { mode: 0o600 });
  try { wrangler('secret', 'bulk', f); } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log('Stored a push key pair as Worker secrets.');
}
console.log(`\nLive at ${url ?? 'the URL above'}. Later updates: npm run live:deploy`);
