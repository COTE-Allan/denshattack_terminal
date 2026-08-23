import { difficultyStarCount } from './format.js';

/** The leading code of a level name, e.g. "1-2-1 Adventure Awaits!" -> "1-2-1". */
export function levelCode(level) {
  return String(level || '')
    .trim()
    .split(/\s+/)[0] || '';
}

/**
 * A route as { levelCode: [{ name, secondsSaved, difficultyStars }] },
 * grouped in level order. Only what's needed to read the route back later
 * (or share it) — not the full skip record, which is looked up fresh by
 * name on import instead of trusting a stale copy in the file.
 */
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

/**
 * Resolves an exported route back to skip ids by matching (level code,
 * name) against the current catalogue — the file only carries a name, not
 * an id, so this is a best-effort match. Anything that no longer matches
 * (renamed or removed skip) comes back in `skipped` instead of failing
 * the whole import.
 */
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
