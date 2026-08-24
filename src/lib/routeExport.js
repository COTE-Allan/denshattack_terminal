import { difficultyStarCount } from './format.js';

// the leading code of a level name, e.g. "1-2-1 adventure awaits!" -> "1-2-1"
export function levelCode(level) {
  return String(level || '')
    .trim()
    .split(/\s+/)[0] || '';
}

// a route as { levelCode: [{ name, secondsSaved, difficultyStars }] }, grouped in level order
export function exportRoute(myRoute) {
  const out = {};
  for (const s of myRoute) {
    const code = levelCode(s.level);
    (out[code] ??= []).push({
      name: s.title,
      secondsSaved: s.timesave ?? 0,
      difficultyStars: difficultyStarCount(s.difficulty),
    });
  }
  return out;
}

// resolves an exported route back to skip ids by (level code, name); unmatched entries land in `skipped` instead of failing the import
export function resolveImportedRoute(data, skips) {
  const ids = [];
  const skipped = [];

  for (const [code, entries] of Object.entries(data ?? {})) {
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      const name = String(entry?.name ?? '').trim();
      const match = skips.find(
        (s) => levelCode(s.level) === code && s.title.trim().toLowerCase() === name.toLowerCase()
      );
      if (match) ids.push(match.id);
      else skipped.push(name || `(unnamed skip in ${code})`);
    }
  }

  return { ids, skipped };
}
