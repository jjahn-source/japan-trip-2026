// Japan's weather warnings, as Google's Weather API passes them on from the Japan Meteorological Agency (the
// only Weather API feature that covers Japan). The morning check (worker/index.ts runWeather) asks for
// where the group is today and tomorrow and pushes only warnings, not the agency's routine notices
// ("General typhoon information") or advisories, each alert once.
export interface JmaAlert { alertId: string; alertTitle?: { text?: string }; eventType?: string; areaName?: string; startTime?: string; expirationTime?: string; dataSource?: { authorityUri?: string } }

/** Warnings worth a push: "Heavy snow warning", "Storm emergency warning"; not information or advisories. */
export const isWarning = (a: JmaAlert) => /warning/i.test(a.alertTitle?.text ?? '') && !/information|advisory/i.test(a.alertTitle?.text ?? '');

/** The push for each warning at a place the group will be ("Hakone, Sat Dec 20"). */
export function weatherNews(alerts: JmaAlert[] | undefined, where: string, url: string): { key: string; title: string; body: string; url: string }[] {
  return (alerts ?? []).filter(isWarning).map((a) => ({
    key: `wx:${a.alertId}`,
    title: `${a.alertTitle!.text} for ${where}`,
    body: `From the Japan Meteorological Agency${a.areaName ? ` (${a.areaName})` : ''}. Check the plan for outdoor stops and trains.`,
    url,
  }));
}
