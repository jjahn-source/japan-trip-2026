// The Overpass selectors in the category table, run as plain predicates on a local OSM extract.
// Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATS } from '../src/lib/categories.ts';
import { compileSelector, compileAny, primaryKeys } from '../src/lib/osmselect.ts';

test('every selector in the category table parses', () => {
  const sels = CATS.flatMap((c) => c.osm ?? []);
  assert.ok(sels.length > 40);
  for (const s of sels) assert.doesNotThrow(() => compileSelector(s), s);
});

test('exact, key-only and regex terms', () => {
  assert.equal(compileSelector('["amenity"="cafe"]')({ amenity: 'cafe' }), true);
  assert.equal(compileSelector('["amenity"="cafe"]')({ amenity: 'cafe_bar' }), false);
  assert.equal(compileSelector('["name"]')({ name: 'x' }), true);
  assert.equal(compileSelector('["name"]')({}), false);
  // `~` is unanchored unless the pattern anchors itself, as Overpass does it
  assert.equal(compileSelector('["cuisine"~"ramen"]')({ cuisine: 'japanese;ramen' }), true);
  assert.equal(compileSelector('["shop"~"^(bakery|pastry)$"]')({ shop: 'bakery' }), true);
  assert.equal(compileSelector('["shop"~"^(bakery|pastry)$"]')({ shop: 'bakery_supply' }), false);
});

test('case-insensitive terms and the Japanese names', () => {
  const donki = compileSelector('["name"~"ドン・キホーテ|Don Quijote",i]');
  assert.equal(donki({ name: 'MEGA don quijote Shibuya' }), true);
  assert.equal(donki({ name: 'ドン・キホーテ新宿' }), true);
  assert.equal(donki({ name: 'Seven-Eleven' }), false);
});

test('several terms in a row must all hold', () => {
  const shinto = compileSelector('["amenity"="place_of_worship"]["religion"="shinto"]');
  assert.equal(shinto({ amenity: 'place_of_worship', religion: 'shinto' }), true);
  assert.equal(shinto({ amenity: 'place_of_worship', religion: 'buddhist' }), false);
  const park = compileSelector('["leisure"~"^(park|garden)$"]["name"]');
  assert.equal(park({ leisure: 'park' }), false); // an unnamed park is not a place to visit
  assert.equal(park({ leisure: 'park', name: 'Ueno' }), true);
});

test('a union matches when any selector does', () => {
  const any = compileAny(['["amenity"="atm"]', '["shop"="convenience"]']);
  assert.equal(any({ shop: 'convenience' }), true);
  assert.equal(any({ shop: 'shoes' }), false);
});

test('an unsupported form is refused, not dropped', () => {
  assert.throws(() => compileSelector('["a"!="b"]'));
  assert.throws(() => compileSelector('["a"="b"] junk'));
});

test('the coarse file filter asks for the keys the table needs', () => {
  const { keys, nameOnly } = primaryKeys(CATS.flatMap((c) => c.osm ?? []));
  for (const k of ['amenity', 'shop', 'leisure', 'tourism', 'cuisine']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes('name') && !keys.includes('religion'));
  assert.equal(nameOnly.length, 3); // Round1, Don Quijote, the 100-yen shops: matched by name alone
});
