// The plan as the live layer's Worker reads it (worker/index.ts): just the times, rides, last trains and
// deadlines it needs for alerts, small enough to parse inside a cron run.
import type { APIRoute } from 'astro';
import { appData } from '../app/build-data';
import type { LivePlan } from '../lib/live';

export const GET: APIRoute = () => {
  const d = appData();
  const plan: LivePlan = {
    generated: d.generated,
    days: d.days.map((x) => ({ n: x.n, date: x.date, lastTrain: x.lastTrain })),
    stops: d.days.flatMap((x) => x.stops.map((s) => ({ id: s.id, d: x.n, name: s.name, cat: s.cat, s: s.startISO, e: s.endISO, ...(s.google?.hours ? { g: s.google.id } : {}) }))),
    legs: d.days.flatMap((x) => Object.values(x.legs).map((l) => ({ from: l.from, to: l.to, minutes: l.minutes, mode: l.mode, text: l.text }))),
    todos: d.todos.map((t) => ({ id: t.id, due: t.due, text: t.text })),
  };
  return new Response(JSON.stringify(plan), { headers: { 'Content-Type': 'application/json' } });
};
