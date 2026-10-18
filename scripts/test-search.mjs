// npm test: the parts of search that decide what a query means and what matches it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery } from '../src/lib/query.ts';
import { fold, keys, score, highlight } from '../src/lib/textmatch.ts';
import { catsOfTags, catsOfTrek } from '../src/lib/categories.ts';
import { parseHours, hoursAt } from '../src/lib/hours.ts';

const p = (q) => { const { brand, ...r } = parseQuery(q); return { ...r, mods: [...r.mods].sort() }; };

test('reads a category, a stop and a condition', () => {
  assert.deepEqual(p('ramen near stop 5 open now'), { cats: ['ramen'], mods: ['open'], text: '', where: { kind: 'stop', day: null, i: 5 } });
});
test('reads a stretch between stops', () => {
  assert.deepEqual(p('toilets between stop 3 and 4').where, { kind: 'between', day: null, a: 3, b: 4 });
  assert.deepEqual(p('konbini from 2 to 3').where, { kind: 'between', day: null, a: 2, b: 3 });
  assert.deepEqual(p('toilets between stop 3 and 4').cats, ['toilets']);
});
test('reads the route, optionally of another day', () => {
  assert.deepEqual(p('coffee along route'), { cats: ['cafe'], mods: [], text: '', where: { kind: 'route', day: null } });
  assert.deepEqual(p('coffee along day 6 route').where, { kind: 'route', day: 6 });
  assert.deepEqual(p('ramen day 6').where, { kind: 'route', day: 6 });
});
test('reads a named place, without swallowing the conditions', () => {
  assert.deepEqual(p('late night izakaya near Shinjuku'), { cats: ['izakaya'], mods: ['late'], text: '', where: { kind: 'place', name: 'shinjuku' } });
  assert.deepEqual(p('ramen near shibuya open now').where, { kind: 'place', name: 'shibuya' });
  assert.deepEqual(p('cafe near Meiji Shrine').where, { kind: 'place', name: 'meiji shrine' });
  assert.deepEqual(p('cafe near Meiji Shrine').cats, ['cafe']);
});
test('near me', () => {
  assert.deepEqual(p('toilets nearby').where, { kind: 'me' });
  assert.deepEqual(p('closest atm').where, { kind: 'me' });
  assert.deepEqual(p('where is the nearest konbini'), { cats: ['konbini'], mods: [], text: '', where: { kind: 'me' } });
});
test('keeps brand names, so 7-Eleven is not any konbini', () => {
  const r = p('7-eleven near me');
  assert.deepEqual(r.cats, ['konbini']);
  assert.equal(r.text, '7-eleven');
  assert.equal(parseQuery('round1').brand, true);
  assert.equal(parseQuery('arcades').brand, false);
});
test('a plain name stays a name', () => {
  assert.deepEqual(p('tokyo tower'), { cats: [], mods: [], text: 'tokyo tower', where: null });
  assert.deepEqual(p('Shibuya Sky'), { cats: [], mods: [], text: 'shibuya sky', where: null });
  assert.deepEqual(p('ichiran ramen'), { cats: ['ramen'], mods: [], text: 'ichiran', where: null });
});
test('Japanese queries', () => {
  assert.deepEqual(p('ラーメン').cats, ['ramen']);
  assert.deepEqual(p('近くのコンビニ').cats, ['konbini']);
  assert.deepEqual(p('近くのコンビニ').where, { kind: 'me' });
});
test('food plus a dish is the dish; bars plus izakaya is izakaya', () => {
  assert.deepEqual(p('ramen food').cats, ['ramen']);
  assert.deepEqual(p('izakaya drinks').cats, ['izakaya']);
});
test('conditions', () => {
  assert.deepEqual(p('vegan food that takes cards').mods, ['card', 'vegetarian']);
  assert.deepEqual(p('izakaya for 8').mods, ['group']);
  assert.deepEqual(p('bars open late').mods, ['late']);
});

test('folding: scripts, widths, macrons, romaji spellings', () => {
  assert.equal(fold('Tōkyō'), fold('Toukyou'));
  assert.equal(fold('Tōkyō'), fold('tokyo'));
  assert.equal(fold('Sensō-ji'), fold('sensoji'));
  assert.equal(fold('Shimbashi'), fold('shinbashi'));
  assert.equal(fold('カフェ'), fold('かふぇ'));
  assert.equal(fold('ＲＯＵＮＤ１'), fold('round1'));
  assert.equal(fold('ｶﾗｵｹ'), fold('カラオケ'));
});
test('ranking: exact beats prefix beats word beats typo', () => {
  const tower = keys('Tokyo Tower', '東京タワー');
  const ramenTower = keys('Tokyo Ramen Tower');
  assert.ok(score('tokyo tower', tower) > score('tokyo tower', ramenTower));
  assert.equal(score('tokyo tower', tower), 1);
  assert.equal(score('東京タワー', tower), 1);
  assert.ok(score('shibu sky', keys('SHIBUYA SKY')) > 0.8);
  assert.ok(score('ichrian', keys('Ichiran Shibuya')) > 0);
  assert.equal(score('xyz', keys('Ichiran')), 0);
  assert.ok(score('cat', keys('Cat Street')) > 0.8 && score('cat', keys('Cat Street')) < 0.9); // a prefix, shorter names first
  assert.ok(score('タワー', tower) > 0);
});
test('highlight marks typed words at word starts only', () => {
  const esc = (s) => s.replace(/</g, '&lt;');
  assert.equal(highlight('Shibuya Sky', 'sky', esc), 'Shibuya <mark>Sky</mark>');
  assert.equal(highlight('Ichiran <x>', 'ichi', esc), '<mark>Ichi</mark>ran &lt;x>');
  assert.equal(highlight('Askew', 'sk', esc), 'Askew');
});

test('OSM tags map onto categories the way Overpass selects them', () => {
  assert.deepEqual(catsOfTags({ amenity: 'restaurant', cuisine: 'ramen;noodle' }).sort(), ['food', 'noodles', 'ramen']);
  assert.deepEqual(catsOfTags({ amenity: 'toilets' }), ['toilets']);
  assert.deepEqual(catsOfTags({ amenity: 'place_of_worship', religion: 'shinto' }), ['shrine']);
  assert.deepEqual(catsOfTags({ leisure: 'park' }), []); // unnamed parks are left out
  assert.deepEqual(catsOfTags({ name: 'ラウンドワン 道頓堀店', leisure: 'bowling_alley' }), ['arcade']);
  assert.deepEqual(catsOfTags({ shop: 'convenience', brand: '7-Eleven' }), ['konbini']);
});
test('TREK categories and names map onto categories', () => {
  assert.deepEqual(catsOfTrek('ramen_restaurant', 'Ichiran Shibuya').sort(), ['food', 'ramen']);
  assert.deepEqual(catsOfTrek('restaurant', 'Ichiran Ramen Ueno').sort(), ['food', 'ramen']);
  assert.deepEqual(catsOfTrek('sake_bar', 'Kurand'), ['bar']);
  assert.deepEqual(catsOfTrek('sport_or_fitness_facility', 'ROUND1 Ikebukuro'), ['arcade']);
});
test('hours across midnight, in Japan time', () => {
  const h = parseHours('Mo-Su 18:00-02:00');
  assert.equal(hoursAt(h, Date.parse('2026-12-16T01:30:00+09:00')).open, true);
  assert.equal(hoursAt(h, Date.parse('2026-12-16T03:00:00+09:00')).open, false);
});
