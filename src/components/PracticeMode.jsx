import { ChevronRight, Clock, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { difficultyStarCount, formatSeconds, timeSaveWatchCount } from '../lib/format.js';
import { SKIP_SORT_OPTIONS, SKIP_SORTS, filterSkips, groupSkipsByLevel } from '../lib/skipSort.js';
import { useLearnedSkips } from '../lib/useLearned.js';
import { IconRow, SortSelect } from './CatalogUI.jsx';

/**
 * A plain checklist: tick off skips as you learn them. Grouped by level
 * since that's how you'd actually work through them (switchable to a flat
 * sort once there are enough skips that "level" isn't the fastest way to
 * find one). Deliberately not a "complete the catalogue" flow — some
 * skips are mutually exclusive alternatives for the same section (you'd
 * pick whichever saves more time, and only one can happen in a given
 * run), and the site has no way to know which is which, so there's no
 * real "100%" to aim for here. This is just a personal record of what you
 * know, shared with the per-card toggle on the main catalogue (same
 * localStorage key).
 */
export default function PracticeMode({ skips }) {
  const { learned, loaded, toggle } = useLearnedSkips();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('level');

  const filtered = useMemo(() => filterSkips(skips, search), [skips, search]);
  const grouped = sort === 'level' ? groupSkipsByLevel(filtered) : null;
  const flat = sort === 'level' ? null : [...filtered].sort(SKIP_SORTS[sort]);
  // Groups auto-expand while searching, so a match isn't hidden behind a
  // collapsed level; left alone (browser-native, uncontrolled) otherwise,
  // so a level opened by hand stays open — same behavior as /route-sheet.
  const forceOpen = search.trim() !== '' ? true : undefined;

  if (!loaded) return null;

  const learnedCount = skips.filter((s) => learned.has(s.id)).length;

  return (
    <div className="practice">
      <p className="practice__note">
        Some skips are alternatives for the same spot and can't both happen
        in one run. This just tracks what you personally know, not a
        checklist to clear.
      </p>

      <div className="catalog__filters">
        <label className="filter">
          <span className="filter__label">Search</span>
          <input
            className="filter__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or description"
          />
        </label>

        <SortSelect value={sort} onChange={setSort} options={SKIP_SORT_OPTIONS} />
      </div>

      <div className="catalog__learned-progress">
        <p>
          {learnedCount} / {skips.length} learned
        </p>
        <div className="catalog__learned-bar">
          <div
            className="catalog__learned-bar-fill"
            style={{ width: `${skips.length ? (learnedCount / skips.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="catalog__empty">No skip matches. Try a different search.</p>
      ) : grouped ? (
        <div className="practice__levels">
          {grouped.map(({ level, skips: levelSkips }) => {
            const levelLearnedCount = levelSkips.filter((s) => learned.has(s.id)).length;

            return (
              <details key={level || 'unlisted'} className="practice__level" open={forceOpen}>
                <summary>
                  <ChevronRight
                    size={14}
                    className="practice__level-chevron"
                    aria-hidden="true"
                  />
                  {level || 'Unlisted'} ({levelLearnedCount}/{levelSkips.length} learned)
                </summary>
                <ul className="practice__checklist">
                  {levelSkips.map((s) => (
                    <ChecklistRow key={s.id} skip={s} learned={learned.has(s.id)} onToggle={toggle} />
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      ) : (
        <ul className="practice__checklist practice__checklist--flat">
          {flat.map((s) => (
            <ChecklistRow key={s.id} skip={s} learned={learned.has(s.id)} onToggle={toggle} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ChecklistRow({ skip: s, learned, onToggle }) {
  const difficultyCount = difficultyStarCount(s.difficulty);
  const watchCount = timeSaveWatchCount(s.timesave);

  return (
    <li className="practice__checklist-item">
      <label className="practice__checklist-check">
        <input type="checkbox" checked={learned} onChange={() => onToggle(s.id)} />
      </label>
      <a className="practice__checklist-title" href={`/skips/${s.slug}/?from=practice`}>
        {s.title}
      </a>
      {difficultyCount > 0 && (
        <span className="practice__checklist-meta">
          <IconRow icon={Star} count={difficultyCount} filled />
        </span>
      )}
      {s.timesave != null && (
        <span className="practice__checklist-meta">
          <IconRow icon={Clock} count={watchCount} /> {formatSeconds(s.timesave)}
        </span>
      )}
    </li>
  );
}
