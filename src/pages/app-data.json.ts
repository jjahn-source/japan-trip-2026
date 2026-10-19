// The whole trip in the app's shape, written once at build time and cached offline by the service worker.
import type { APIRoute } from 'astro';
import { appData } from '../app/build-data';

export const GET: APIRoute = () => new Response(JSON.stringify(appData()), { headers: { 'Content-Type': 'application/json' } });
