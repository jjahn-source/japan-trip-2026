// The street-photo picker in scripts/streetview.mjs: tiles, the nearest panorama, the camera's aim, and
// reading Google's responses. Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_M, bearing, keyOf, mapsLink, metres, nearest, parseCoverage, parseDate, tileOf, tilesNear } from './streetview.mjs';

test('the zoom-17 tile of a point', () => {
  // Tokyo Tower: x = floor((139.74543 + 180) / 360 · 2^17) = floor(116415.4)
  assert.deepEqual(tileOf(35.65858, 139.74543), [116415, 51623]);
});

test('a point near a tile corner looks in every tile it could reach', () => {
  const [x, y] = tileOf(35.65858, 139.74543);
  assert.equal(tilesNear(35.65858, 139.74543).length >= 1, true);
  // Exactly on a tile's west edge: the tile to the west is in reach too.
  const lngEdge = (x / 2 ** 17) * 360 - 180;
  const xs = new Set(tilesNear(35.65858, lngEdge).map((t) => t[0]));
  assert.ok(xs.has(x - 1) && xs.has(x));
  assert.ok(tilesNear(35.65858, lngEdge).every((t) => Math.abs(t[1] - y) <= 1));
});

test('distance and bearing at street scale', () => {
  const a = [35.0, 139.0];
  assert.ok(Math.abs(metres(a, [35.0001, 139.0]) - 11.1) < 0.2);
  assert.ok(Math.abs(bearing(a, [35.001, 139.0]) - 0) < 0.5); // due north
  assert.ok(Math.abs(bearing(a, [35.0, 139.001]) - 90) < 0.5); // due east
  assert.ok(Math.abs(bearing(a, [34.999, 139.0]) - 180) < 0.5);
  assert.ok(Math.abs(bearing(a, [35.0, 138.999]) - 270) < 0.5);
});

test('nearest panorama within range, none beyond it', () => {
  const panos = [{ pano: 'far', lat: 35.001, lng: 139 }, { pano: 'near', lat: 35.0001, lng: 139 }, { pano: 'mid', lat: 35.0002, lng: 139 }];
  const p = nearest(panos, 35, 139);
  assert.equal(p.pano, 'near');
  assert.ok(p.d < 12);
  assert.equal(nearest([{ pano: 'x', lat: 35 + (MAX_M + 5) / 111320, lng: 139 }], 35, 139), null);
});

test('coverage keeps Google panoramas and drops uploaded photo spheres', () => {
  const body = `)]}'\n${JSON.stringify([null, [null, [
    [[[2, 'googlePanoId01'], null, [[null, null, 35.1, 139.1]]]],
    [[[10, 'userPhotoSphere'], null, [[null, null, 35.2, 139.2]]]],
    [[1, null, [[null, null, 35.3, 139.3]]]],
  ]]])}`;
  assert.deepEqual(parseCoverage(body), [{ pano: 'googlePanoId01', lat: 35.1, lng: 139.1 }]);
  assert.deepEqual(parseCoverage(`)]}'\n[null,null]`), []);
});

test('capture month from metadata, when there is one', () => {
  const meta = (date) => `)]}'\n${JSON.stringify([null, [[[1], null, null, null, null, null, [null, null, null, null, null, null, null, date]]]])}`;
  assert.equal(parseDate(meta([2020, 3])), '2020-03');
  assert.equal(parseDate(meta([2020, 13])), null);
  assert.equal(parseDate(meta(null)), null);
});

test('keys and links', () => {
  assert.equal(keyOf(35.726723, 139.687636), '35.72672,139.68764');
  const u = new URL(mapsLink('ab-c_1', 124.6));
  assert.equal(u.searchParams.get('map_action'), 'pano');
  assert.equal(u.searchParams.get('pano'), 'ab-c_1');
  assert.equal(u.searchParams.get('heading'), '125');
});
