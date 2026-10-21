// Yen in dollars at today's rate, for the stop details and the budget. The rate is fetched once and
// kept for 12 hours on the phone, so prices still convert offline.
const KEY = 'jt:fx';
const TTL = 12 * 3600e3;

export const fx = $state({ rate: (() => { try { const c = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return c?.rate ?? null; } catch { return null; } })() as number | null });

let asked = false;
export function loadRate() {
  if (asked) return;
  asked = true;
  try { const c = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (c && Date.now() - c.at < TTL) return; } catch { /* fetch below */ }
  fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=JPY', { signal: AbortSignal.timeout(8e3) }).then((r) => r.json()).then((j) => {
    if (!j?.rates?.JPY) return;
    fx.rate = j.rates.JPY;
    try { localStorage.setItem(KEY, JSON.stringify({ rate: fx.rate, at: Date.now() })); } catch { /* this session only */ }
  }).catch(() => {});
}

const dollars = (yen: number, rate: number) => { const v = yen / rate; return v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); };
/** "¥500–1,500 pp" → "3.2–9.6"; "¥6,800" → "45"; null without a price or a rate. */
export function usd(text: string | null): string | null {
  const m = text?.match(/¥\s?([\d,]+)(?:\s*[–~〜-]\s*¥?\s?([\d,]+))?/);
  if (!m || !fx.rate) return null;
  const a = Number(m[1].replace(/,/g, '')), b = m[2] ? Number(m[2].replace(/,/g, '')) : null;
  return b && b > a ? `${dollars(a, fx.rate)}–${dollars(b, fx.rate)}` : dollars(a, fx.rate);
}
