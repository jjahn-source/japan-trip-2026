// One search, two depths: does Google Maps' open-now list answer this, or does it need Gemini's judgement
// too? Maps always runs (fast, cheap); this only decides whether Gemini also does (slow, paid). TypeSafe's Jev
// decides when the Worker has its key (one Choice question, ~a hundred-thousandth of a cent); otherwise, and
// offline, a word check does. When Jev isn't sure, Gemini runs: a wasted call costs less than a missed answer.

export type Route = 'maps' | 'gemini';
export interface RouteAnswer { route: Route; via: 'jev' | 'words'; confidence: number | null }

/** Words a plain list of open places can't check: conditions, comparisons, advice, the plan, the group. */
const JUDGEMENT = /\b(cards?|credit|cash|quiet|private|rooms?|view|views|cheap|budget|vegetarian|vegan|halal|gluten|allerg\w*|smok\w*|english menu|tattoo\w*|eight|8|groups?|all of us|together|seat|fit|after|before|last train|best|vs|versus|worth|should|which|recommend\w*|good for|next stop|tonight|tomorrow|plan|book\w*|reserv\w*|instead|alternative|warm|chill|vibe)\b|[？?]|個室|禁煙|カード/i;

/** The free check: a real question (a question mark, or five or more words) or a condition Maps can't filter on. */
export function wordsRoute(q: string): Route {
  const t = q.trim();
  return JUDGEMENT.test(t) || t.split(/\s+/).length >= 5 ? 'gemini' : 'maps';
}

/** Jev's answer below this confidence sends the question to Gemini as well. */
export const JEV_CONFIDENT = 0.6;
export const JEV_MODEL = 'jev-latest';

/** The System One request: the search, the time and today's plan as state; one Choice question. */
export function jevBody(q: string, when: string, plan: string[]) {
  return {
    model: JEV_MODEL,
    state: { search: q, time_in_japan: when, todays_plan: plan, group: '8 friends travelling together' },
    questions: {
      route: {
        type: 'choice',
        instructions: 'The group typed `search` into their trip app. A list of nearby places that are open right now, with ratings, walking time and closing time, will be shown for it. Is that list enough, or does the search need judgement the list cannot give?',
        criteria: {
          list: {
            what: 'They want a kind of place or a named place nearby, and a list of open places answers it',
            examples: ['ramen', 'izakaya open now', 'konbini', 'Don Quijote', 'coin lockers', 'karaoke near me', 'ATM'],
            not_for: 'A search that adds a condition the list cannot check, or asks for advice',
          },
          judgement: {
            what: 'It needs judgement: a condition a list of places cannot check (takes cards, quiet, private room, seats all 8 together, vegetarian, a view, cheap), a comparison or recommendation, advice, or a question about their own plan or timing',
            examples: ['late ramen that takes cards', 'somewhere quiet for 8 to sit down', 'is Uoshin good for a group', 'what should we do before the last train', 'best view near the next stop'],
          },
        },
      },
    },
  };
}

/** Jev's route from its answer; unsure or malformed answers go to Gemini. */
export function readJev(r: { answers?: { route?: { choice?: string; confidence?: number } } } | null): RouteAnswer | null {
  const a = r?.answers?.route;
  if (!a?.choice || typeof a.confidence !== 'number') return null;
  return { route: a.choice === 'list' && a.confidence >= JEV_CONFIDENT ? 'maps' : 'gemini', via: 'jev', confidence: a.confidence };
}
