// The whole trip as a Google Maps file (/trip.kml): import it at mymaps.google.com and every stop shows in
// the Google Maps app under Saved → Maps, where the group navigates anyway. One layer (My Maps allows ten),
// each pin named by day and order ("D3·4 Edo-Tokyo Museum") with its times, address and a link back here.
import type { APIRoute } from 'astro';
import { appData } from '../app/build-data';

const x = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ site }) => {
  const d = appData();
  const base = site ? site.toString().replace(/\/$/, '') : '';
  const marks = d.days.flatMap((day) => day.stops.filter((s) => s.lat != null && s.lng != null).map((s) => `
    <Placemark>
      <name>${x(`D${day.n}·${s.i} ${s.name}`)}</name>
      <description>${x([`${day.label} · ${s.start}–${s.end}`, s.hook ?? s.plan, s.address, base ? `${base}/day/${day.n}/#${s.id}` : null].filter(Boolean).join('\n'))}</description>
      <Point><coordinates>${s.lng},${s.lat},0</coordinates></Point>
    </Placemark>`));
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${x(d.title)}</name>${marks.join('')}
  </Document>
</kml>
`;
  return new Response(kml, { headers: { 'Content-Type': 'application/vnd.google-earth.kml+xml' } });
};
