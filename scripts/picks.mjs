// Researched picks: events and places found by web research for the trip's own dates (Dec 15–29, 2026),
// each with its source. This file is the research; running it adds coordinates, a photo and the nearest
// stop, and writes data/picks.json, which the site shows next to the trending places.
//
// Dates come from the sources listed; several organisers had not published final 2026 details when this
// was written (Oct 2026), and `check` says so on the card. Rerun after editing: npm run picks
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'japan-plan-c-trip-site/1.0 (private trip planner)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PICKS = [
  {
    day: 3, dedupe: 'Nonbei', name: 'Nonbei Yokochō', ja: 'のんべい横丁', kind: 'bar', at: [35.6603, 139.7022], wiki: 'en:Nonbei Yokochō',
    why: "Shibuya's lantern-lit 'Drunkard's Alley': a row of six-seat bars by the tracks. Good for a round before karaoke.",
    when: 'Most bars from about 18:00', source: 'https://takemetherejapan.com/posts/shibuya-harajuku-izakaya-guide/', sourceName: 'Take Me There Japan',
  },
  {
    day: 5, dedupe: 'Tokyo Christmas Market', name: 'Tokyo Christmas Market (Shin-Toyosu)', ja: '東京クリスマスマーケット 新豊洲', kind: 'event', at: [35.6486, 139.7898], wiki: null,
    why: "Japan's biggest Christmas market moved to Shin-Toyosu for 2026, next to teamLab Planets: German stalls, glühwein, a giant tree.",
    when: 'Nov 20 – Dec 25 · 11:00–21:30 · ¥1,000 weekdays', check: true,
    source: 'https://www.kkday.com/en/blog/101429/tokyo-christmas-market', sourceName: 'KKday',
  },
  {
    day: 6, dedupe: 'Gōra Park', name: 'Gōra Park winter illumination', ja: '強羅公園 イルミネーション', kind: 'event', at: [35.2486, 139.0471], wiki: 'en:Gōra Park',
    why: 'A light tunnel through the bamboo grove of the French-style park, five minutes up from the Gyoza Center. On a clear evening, Fuji too.',
    when: 'Dec 1 – Feb 28 · from dusk · ¥520', check: true,
    source: 'https://anabaoffjapan.com/articles/kanagawa-winter-illuminations/', sourceName: 'Anaba OffJapan',
  },
  {
    day: 7, dedupe: 'Crystal Illumination', name: 'Hakone Glass Forest: Crystal Illumination', ja: '箱根ガラスの森 クリスタル・イルミネーション', kind: 'event', at: [35.2597, 139.0247], wiki: 'en:Hakone Glass Forest Museum',
    why: "A 10 m tree of 150,000 crystal pieces and lantern-lit gardens, near the villa. The plan's own fallback if the ropeway is stopped.",
    when: 'Dec 1 – 25 · 10:00–17:00 · ¥1,800', check: true,
    source: 'https://tokyocheapo.com/events/hakone-crystal-illumination/', sourceName: 'Tokyo Cheapo',
  },
  {
    day: 12, dedupe: 'Nigatsu', name: 'Nigatsu-dō balcony', ja: '東大寺 二月堂', kind: 'view', at: [34.6894, 135.8443], wiki: 'en:Nigatsu-dō',
    why: "A short climb above the Great Buddha Hall: Tōdai-ji's hilltop hall with a free wraparound view over Nara's rooftops.",
    when: 'Open all day · free',
    source: 'https://selfguidejapan.com/blog/things-to-do-in-nara', sourceName: 'Self Guide Japan',
  },
  {
    day: 14, dedupe: 'Flash Disc', name: 'Flash Disc Ranch', ja: 'フラッシュ・ディスク・ランチ', kind: 'shop', at: [35.6612, 139.6676], wiki: null,
    why: "Shimokitazawa's most-recommended vinyl shop: a ¥100 bin and crates of Japanese city pop and soundtracks.",
    when: 'Afternoons',
    source: 'https://arigatojapan.co.jp/tokyo-osaka-kyoto-record-shops/', sourceName: 'Arigato Japan',
  },
  {
    day: 15, dedupe: 'Marunouchi', name: 'Marunouchi Illumination', ja: '丸の内イルミネーション', kind: 'event', at: [35.6795, 139.7639], wiki: 'en:Marunouchi',
    why: 'Champagne-gold lights along the tree-lined Naka-dōri, a 10-minute walk from Itoya Ginza, and still on after Christmas.',
    when: 'Nov 12 – Feb 14 · 16:00–23:00 (to midnight in Dec) · free',
    source: 'https://www.gotokyo.org/en/story/guide/winter-illuimnation-guide/index.html', sourceName: 'GO TOKYO (official)',
  },
];

// The trip as the build wrote it (src/pages/trip-data.json.ts), so build first.
const trip = JSON.parse(await readFile(new URL('../dist/trip-data.json', import.meta.url), 'utf8'));
const km = (a, b) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Lead photo from the Wikipedia article, when there is one.
async function photo(ref) {
  if (!ref) return { photo: null, photoPage: null };
  const [lang, title] = ref.split(':');
  for (let i = 0; i < 4; i++) {
    const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail|name&pithumbsize=360&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const pg = (await res.json()).query?.pages?.[0];
      return { photo: pg?.thumbnail?.source ?? null, photoPage: pg?.pageimage ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(pg.pageimage)}` : null };
    }
    await sleep((Number(res.headers.get('retry-after')) || 5) * 1000);
  }
  return { photo: null, photoPage: null };
}

const plan = await readFile(new URL('../data/japan-plan-c.md', import.meta.url), 'utf8');
const out = { generated: new Date().toISOString(), method: 'Web research for the trip dates; each pick cites its source.', days: {} };
for (const p of PICKS) {
  // Already in the plan? Then it isn't a pick.
  if (p.dedupe && plan.toLowerCase().includes(p.dedupe.toLowerCase())) { console.log(`D${p.day} ${p.name}: already in the plan, skipped`); continue; }
  const stops = trip.stops.filter((s) => s.d === p.day && s.lat != null);
  const [lat, lng] = p.at;
  const near = stops.map((s) => ({ s, k: km([lng, lat], [s.lng, s.lat]) })).sort((a, b) => a.k - b.k)[0];
  const ph = await photo(p.wiki);
  await sleep(800);
  (out.days[p.day] ??= []).push({
    id: `pick-${p.day}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    name: p.name, ja: p.ja, kind: p.kind, lat, lng,
    near: { stop: near.s.id, i: near.s.i, km: +near.k.toFixed(2) },
    views30: 0, rise: 1, december: 1, tag: 'pick',
    why: p.why, when: p.when, check: !!p.check, source: p.source, sourceName: p.sourceName,
    wiki: p.wiki ? `https://${p.wiki.split(':')[0]}.wikipedia.org/wiki/${encodeURIComponent(p.wiki.split(':')[1].replace(/ /g, '_'))}` : p.source,
    ...ph,
  });
  console.log(`D${p.day} ${p.name}: ${near.k.toFixed(2)} km from stop ${near.s.i}${ph.photo ? ' · photo' : ''}`);
}
await writeFile(new URL('../data/picks.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote data/picks.json: ${Object.values(out.days).flat().length} picks`);
