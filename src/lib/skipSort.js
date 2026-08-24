// shared search/sort/group helpers for practicemode.jsx and routesheet.jsx

export const SKIP_SORT_OPTIONS = [
  { value: 'level', label: 'Level' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'difficulty', label: 'Difficulty (hardest first)' },
  { value: 'timesave', label: 'Time save (biggest first)' },
];

// 'level' isn't here: sorting by level means grouping instead, see groupSkipsByLevel below
export const SKIP_SORTS = {
  name: (a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }),
  difficulty: (a, b) => Number(b.difficulty || 0) - Number(a.difficulty || 0),
  timesave: (a, b) => (b.timesave ?? -1) - (a.timesave ?? -1),
};

export function filterSkips(skips, search) {
  const q = search.trim().toLowerCase();
  if (!q) return skips;
  return skips.filter((s) => `${s.title} ${s.summary}`.toLowerCase().includes(q));
}

// groups already-sorted-by-level skips into { level, skips[] } sections, preserving order
export function groupSkipsByLevel(skips) {
  const groups = [];
  const byLevel = new Map();
  for (const s of skips) {
    let group = byLevel.get(s.level);
    if (!group) {
      group = { level: s.level, skips: [] };
      byLevel.set(s.level, group);
      groups.push(group);
    }
    group.skips.push(s);
  }
  return groups;
}
