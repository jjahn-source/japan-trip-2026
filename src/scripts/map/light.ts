// Sunlight → map palette. The real sun altitude at a place and minute picks a blend
// between four lighting keyframes; morning and evening twilight tint differently.
import { sunPosition } from '../../lib/sun';

export interface Palette {
  bg: string; park: string; water: string; road: string; roadCase: string; building: string;
  label: string; halo: string; rail: string; sky: string; horizon: string; fog: string;
  light: string; intensity: number; shadow: string; highlight: string;
  route: string; routeHalo: string; stopFill: string; stopText: string;
}

type Key = Record<keyof Palette, string | number>;

const NIGHT: Key = {
  bg: '#15132a', park: '#16192a', water: '#0b0a1d', road: '#2c2853', roadCase: '#1c193a', building: '#24203f',
  label: '#bdb7ec', halo: '#100e22', rail: '#5f57ab', sky: '#04040e', horizon: '#1d1846', fog: '#120f2b',
  light: '#8c8aff', intensity: 0.12, shadow: '#05040c', highlight: '#3a3570',
  route: '#b9b0ff', routeHalo: '#100e22', stopFill: '#1d1a3a', stopText: '#e6e2ff',
};
const TWILIGHT_EVE: Key = {
  bg: '#2b2550', park: '#2a2b49', water: '#1a1840', road: '#4b4482', roadCase: '#312b61', building: '#3a3467',
  label: '#e0dbff', halo: '#1c1840', rail: '#7c73c9', sky: '#1d1b4f', horizon: '#d2577a', fog: '#3d2e64',
  light: '#c48cff', intensity: 0.22, shadow: '#120e2a', highlight: '#6b5aa8',
  route: '#d8d0ff', routeHalo: '#1c1840', stopFill: '#2b2550', stopText: '#f3f0ff',
};
const TWILIGHT_MORN: Key = { ...TWILIGHT_EVE, horizon: '#a46fb0', sky: '#232a5c', fog: '#3a3768' };
// The sun on the horizon and just under it. Straight blends from violet night to peach day pass
// through mud-grey, so these two keyframes keep the colour saturated: dusky magenta, then rose.
const DUSK_EVE: Key = {
  bg: '#5e3f73', park: '#573f6a', water: '#33295f', road: '#9a6f9c', roadCase: '#4a3263', building: '#6a4a7c',
  label: '#f6e6ff', halo: '#3a2550', rail: '#b08ad0', sky: '#2c2366', horizon: '#ff5e5b', fog: '#7a4470',
  light: '#e07ab0', intensity: 0.28, shadow: '#24143a', highlight: '#a77bb8',
  route: '#f3eaff', routeHalo: '#2a1a40', stopFill: '#3a2550', stopText: '#f6e6ff',
};
const DUSK_MORN: Key = { ...DUSK_EVE, bg: '#4f4378', park: '#4a4470', water: '#2c2b66', horizon: '#f58fa0', fog: '#5d4a80', light: '#c99ae0' };
const SUNSET_EVE: Key = {
  bg: '#e8b7a6', park: '#d9b39e', water: '#8f7ec6', road: '#fde5d6', roadCase: '#c8928b', building: '#deae9f',
  label: '#4a2846', halo: '#f7dccf', rail: '#a07cbc', sky: '#5b4aa8', horizon: '#ff6a3d', fog: '#f19c7c',
  light: '#ff8a5c', intensity: 0.38, shadow: '#5a2f52', highlight: '#ffd6bf',
  route: '#3a2f8f', routeHalo: '#fbe7dc', stopFill: '#ffffff', stopText: '#3a2f8f',
};
const SUNSET_MORN: Key = { ...SUNSET_EVE, bg: '#e9c3c0', park: '#d8bfb3', water: '#9a9ad0', horizon: '#ff9f7a', fog: '#f2c0ae', light: '#ffb08c' };
const GOLDEN_EVE: Key = {
  bg: '#f2e0d3', park: '#e3ddcb', water: '#bab3dc', road: '#fff4ea', roadCase: '#e3c8b6', building: '#ecd6c8',
  label: '#5a3e5a', halo: '#fbf2eb', rail: '#a68fc0', sky: '#6c5db7', horizon: '#ff8a4b', fog: '#f7c6a6',
  light: '#ffae6b', intensity: 0.45, shadow: '#5e3550', highlight: '#fff0e2',
  route: '#3a2f8f', routeHalo: '#fbf2eb', stopFill: '#ffffff', stopText: '#3a2f8f',
};
const GOLDEN_MORN: Key = { ...GOLDEN_EVE, bg: '#ece2e6', sky: '#8aa0d9', horizon: '#ffb98c', fog: '#f4d5c6', light: '#ffc79a' };
const DAY: Key = {
  bg: '#eef0f4', park: '#dfe6dc', water: '#c3cdea', road: '#ffffff', roadCase: '#d5d6e4', building: '#e2e2ea',
  label: '#4a4575', halo: '#f6f7fa', rail: '#9c96cc', sky: '#79a2e6', horizon: '#e6edf8', fog: '#edf1f9',
  light: '#ffffff', intensity: 0.38, shadow: '#3f3b63', highlight: '#ffffff',
  route: '#3a2f8f', routeHalo: '#f6f7fa', stopFill: '#ffffff', stopText: '#3a2f8f',
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
const smooth = (x: number) => x * x * (3 - 2 * x);
const mixHex = (a: string, b: string, t: number) => { const ca = hex(a); const cb = hex(b); return toHex(ca.map((v, i) => v + (cb[i] - v) * t)); };
/** WCAG relative luminance of a hex colour. */
function luminance(h: string) {
  const [r, g, b] = hex(h).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(a: Key, b: Key, t: number): Palette {
  const out = {} as Record<string, string | number>;
  const k = smooth(Math.min(1, Math.max(0, t)));
  for (const key of Object.keys(a) as (keyof Palette)[]) {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'number' && typeof y === 'number') out[key] = x + (y - x) * k;
    else { const ca = hex(x as string); const cb = hex(y as string); out[key] = toHex(ca.map((v, i) => v + (cb[i] - v) * k)); }
  }
  return out as unknown as Palette;
}

export type Phase = 'night' | 'dawn' | 'day' | 'dusk';

export function lighting(ms: number, lat: number, lng: number) {
  const { altitude, azimuth } = sunPosition(ms, lat, lng);
  const morning = azimuth < 180;
  const twilight = morning ? TWILIGHT_MORN : TWILIGHT_EVE;
  const dusk = morning ? DUSK_MORN : DUSK_EVE;
  const sunset = morning ? SUNSET_MORN : SUNSET_EVE;
  const golden = morning ? GOLDEN_MORN : GOLDEN_EVE;
  let palette: Palette;
  if (altitude <= -12) palette = mix(NIGHT, NIGHT, 0);
  else if (altitude <= -6) palette = mix(NIGHT, twilight, (altitude + 12) / 6);
  else if (altitude <= -3) palette = mix(twilight, dusk, (altitude + 6) / 3);
  else if (altitude <= 0) palette = mix(dusk, sunset, (altitude + 3) / 3);
  else if (altitude <= 4) palette = mix(sunset, golden, altitude / 4);
  else if (altitude <= 14) palette = mix(golden, DAY, (altitude - 4) / 10);
  else palette = mix(DAY, DAY, 0);
  // Blends between a dark and a light keyframe can put ink and ground at the same
  // lightness (mid-twilight). Pick the route, stop and label inks from the ground's
  // actual luminance so they always read.
  const light = luminance(palette.bg) > 0.3;
  palette.route = light ? '#3a2f8f' : '#d8d0ff';
  palette.routeHalo = light ? '#ffffff' : '#100e22';
  // Stop rings stay white with violet numerals in every light: the card's own mark, glowing at night.
  palette.stopFill = '#ffffff';
  palette.stopText = '#3a2f8f';
  palette.label = light ? '#3d3768' : '#e6e2ff';
  palette.halo = light ? mixHex(palette.bg, '#ffffff', 0.5) : mixHex(palette.bg, '#000000', 0.4);
  const phase: Phase = altitude < -6 ? 'night' : altitude < 6 ? (morning ? 'dawn' : 'dusk') : 'day';
  return { palette, phase, altitude, azimuth };
}
