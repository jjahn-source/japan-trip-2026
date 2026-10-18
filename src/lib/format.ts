// Small, safe inline formatter for the export's text: **bold**, [label](url),
// bare domains left as text, and Japanese runs tagged lang="ja" so phones pick
// Japanese glyph forms instead of Chinese ones (Han unification).

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const CJK = /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〜「」『』（）、。！？・：／　-〿！-～]+(?:[\s\d]*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}「」（）、。！？・ー]+)*)/gu;

/** Wrap Japanese runs in <span lang="ja">; input must already be escaped. */
export function ja(html: string) {
  return html.replace(CJK, '<span lang="ja">$1</span>');
}

/** Turn bare emails and domain paths ("tablecheck.com/en/…") into markdown links. */
export function linkify(src: string) {
  return src
    .replace(/\b([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\b/g, '[$1](mailto:$1)')
    .replace(/(^|[\s(])((?:[a-z0-9-]+\.)+(?:com|jp|net|org|guide|works)(?:\/[^\s,;)]*)?)/gi, (m, pre, dom) =>
      /@/.test(dom) ? m : `${pre}[${dom}](https://${dom.replace(/[.]$/, '')})`);
}

export function inline(src: string) {
  const out: string[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?|mailto):[^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    out.push(ja(esc(src.slice(last, m.index))));
    if (m[1] !== undefined) out.push(`<strong>${ja(esc(m[1]))}</strong>`);
    else out.push(`<a href="${esc(m[3])}" target="_blank" rel="noopener">${ja(esc(m[2]))}</a>`);
    last = m.index + m[0].length;
  }
  out.push(ja(esc(src.slice(last))));
  return out.join('');
}

/** "¥2,900 pp" → { amount: "¥2,900", unit: "pp" }; "$898.70 USD (group total)" → group. */
export function price(p: string | null) {
  if (!p) return null;
  const group = /group total/i.test(p);
  const amount = p.replace(/\s*\(group total\)/i, '').replace(/\s*USD/, '').replace(/\s*pp$/, '').trim();
  return { amount, unit: group ? 'group' : 'pp' };
}

/** tel: href from the export's phone formats ("03-3342-2011", "+81334261437", "050-…"). */
export function tel(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? `tel:${digits}` : `tel:+81${digits.replace(/^0/, '')}`;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "2026-12-20" → "12.20" */
export const dotDate = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}`;

/** Google Maps directions link (walking/transit picks itself in the app). */
export const directions = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;

/** Prefix a site path with Astro's base (supports sub-path deploys). */
export function url(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
