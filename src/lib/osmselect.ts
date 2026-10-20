// Overpass selectors as plain predicates over a tag map, so the category table (categories.ts keeps its
// `osm` selectors in Overpass syntax) can filter a local OpenStreetMap extract as well as feed a query.
// Only the grammar the table uses: ["k"], ["k"="v"], ["k"~"re"] and ["k"~"re",i], any number in a row
// (all must hold). Anything else throws, so a new selector form is noticed here and not silently dropped.
export type Tags = Record<string, string | undefined>;

const TERM = /\["([^"]+)"(?:(=|~)"([^"]*)"(,i)?)?\]/y;

/** One selector, e.g. `["amenity"="place_of_worship"]["religion"="shinto"]`. */
export function compileSelector(sel: string): (t: Tags) => boolean {
  const tests: ((t: Tags) => boolean)[] = [];
  TERM.lastIndex = 0;
  let at = 0;
  while (at < sel.length) {
    TERM.lastIndex = at;
    const m = TERM.exec(sel);
    if (!m) throw new Error(`Unsupported Overpass selector at ${at}: ${sel}`);
    const [, key, op, val, ci] = m;
    if (!op) tests.push((t) => t[key] !== undefined);
    else if (op === '=') tests.push((t) => t[key] === val);
    else { // Overpass `~` is an unanchored regular expression on the value
      const re = new RegExp(val, ci ? 'i' : '');
      tests.push((t) => t[key] !== undefined && re.test(t[key]!));
    }
    at = TERM.lastIndex;
  }
  return (t) => tests.every((f) => f(t));
}

/** A union of selectors: true when any one holds (the `( nwr[..]; nwr[..]; )` of an Overpass query). */
export function compileAny(sels: string[]): (t: Tags) => boolean {
  const fs = sels.map(compileSelector);
  return (t) => fs.some((f) => f(t));
}

/** The keys a coarse file filter can ask for: every key some selector needs, minus the ones that only
 *  narrow another (name, religion). A selector that names only those can't be pre-filtered by key. */
export function primaryKeys(sels: string[]): { keys: string[]; nameOnly: string[] } {
  const keys = new Set<string>(), nameOnly: string[] = [];
  for (const s of sels) {
    const ks = [...s.matchAll(/\["([^"]+)"/g)].map((m) => m[1]).filter((k) => k !== 'name' && k !== 'religion');
    if (ks.length) ks.forEach((k) => keys.add(k)); else nameOnly.push(s);
  }
  return { keys: [...keys].sort(), nameOnly };
}
