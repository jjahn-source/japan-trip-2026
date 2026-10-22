// "Ask": a question in plain words, answered by Gemini grounded in Google Maps (worker/index.ts /api/ask).
// The Worker sends the phone's position, the time in Japan and today's plan (where the group is, what's
// next), so the answer fits the night they're having; Google Maps supplies the places, hours and ratings,
// and its sources are shown under the answer with links, as Google requires.
import type { PlanStop } from './live';

export const ASK_MODEL = 'gemini-3.8-flash';
/** A question is a sentence, not an essay. */
export const ASK_MAX = 300;

const SYSTEM = `You help a group of 8 friends, all about 20, on a trip in Japan. They read your answer on a phone, often outside at night.
Use Google Maps for every fact about a place. Unless they ask otherwise: places open right now (the time is given), that can seat all 8 together, within a short walk of where they are.
Answer in at most 3 options, one short line each: the name, then why it fits, the walking time and when it closes. Add one practical tip only if it changes what they do (cash only, a queue, book by phone).
Plain text: no headings, no tables, no markdown. If you are not sure something is open or fits 8, say to check. Never book or pay for anything.`;

/** Today's plan in a few lines: the trip day running at `now` (a trip day runs 5am to 5am), each stop with its
 *  time, and which one is on now or next. */
export function planLines(stops: PlanStop[], now: number): string[] {
  const live = stops.filter((s) => !s.cancelled);
  const day = live.find((s) => Date.parse(s.s) <= now && now < Date.parse(s.e))?.d
    ?? live.find((s) => Date.parse(s.s) > now && Date.parse(s.s) - now < 18 * 3600e3)?.d;
  if (day == null) return [];
  const hm = (iso: string) => iso.slice(11, 16);
  return live.filter((s) => s.d === day && s.cat !== 'transport').map((s) => {
    const on = Date.parse(s.s) <= now && now < Date.parse(s.e) ? ' (now)' : '';
    return `${hm(s.s)}–${hm(s.e)} ${s.name}${on}`;
  });
}

/** The request body for Gemini: the house rules, the context and the question, with Google Maps on. */
export function askBody(q: string, at: { lat: number; lng: number }, now: number, stops: PlanStop[]) {
  const jst = new Date(now + 9 * 3600e3);
  const when = `${jst.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })} ${jst.toISOString().slice(11, 16)}`;
  const plan = planLines(stops, now);
  const context = [`It is ${when} in Japan.`, plan.length ? `Today's plan:\n${plan.join('\n')}` : null, `Question: ${q}`].filter(Boolean).join('\n\n');
  return {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: context }] }],
    tools: [{ googleMaps: {} }],
    // Low thinking: about 8 s instead of 37 s, same answers (Flash-Lite is faster but got walks and hours wrong).
    generationConfig: { thinkingConfig: { thinkingLevel: 'low' } },
    toolConfig: { retrievalConfig: { latLng: { latitude: at.lat, longitude: at.lng }, languageCode: 'en' } },
  };
}

interface GeminiAnswer {
  candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { maps?: { uri?: string; title?: string } }[] } }[];
}
/** The answer as plain text, and its Google Maps sources (one per place, in the order given). */
export function parseAnswer(r: GeminiAnswer): { text: string; sources: { title: string; uri: string }[] } {
  const c = r.candidates?.[0];
  const text = (c?.content?.parts ?? []).map((p) => p.text ?? '').join('').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/gm, '').trim();
  const seen = new Set<string>();
  const sources = (c?.groundingMetadata?.groundingChunks ?? []).flatMap((g) => {
    const uri = g.maps?.uri, title = g.maps?.title?.replace(/^Review of /, '').replace(/ - Google Maps$/, '');
    if (!uri || !title || seen.has(title)) return [];
    seen.add(title);
    return [{ title, uri }];
  });
  return { text, sources };
}
