// The trip as the build-time data scripts read it (npm run legs, places, picks, trending, transit,
// climate): stops with coordinates, days and stays. Not used by the app itself.
import { clientTrip } from '../lib/client';

export const GET = () => new Response(JSON.stringify(clientTrip()), { headers: { 'content-type': 'application/json' } });
