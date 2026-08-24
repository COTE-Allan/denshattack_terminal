import { ChevronRight, Clock, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { difficultyStarCount, formatSeconds, timeSaveWatchCount } from '../lib/format.js';
import { SKIP_SORT_OPTIONS, SKIP_SORTS, filterSkips, groupSkipsByLevel } from '../lib/skipSort.js';
import { useLearnedSkips } from '../lib/useLearned.js';
import { useSkips } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { IconRow, SortSelect } from './CatalogUI.jsx';

// a plain checklist, grouped by level, shared with the per-card toggle on the main catalogue (same localStorage key)
export default function PracticeMode() {
  const { data: skips, loading, error } = useSkips();
  const { learned, loaded, toggle } = useLearnedSkips();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('level');

  const filtered = useMemo(() => (skips ? filterSkips(skips, search) : []), [skips, search]);
  const grouped = sort === 'level' ? groupSkipsByLevel(filtered) : null;
  const flat = sort === 'level' ? null : [...filtered].sort(SKIP_SORTS[sort]);
  const forceOpen = search.trim() !== '' ? true : undefined; // groups auto-expand while searching

  if (!loaded || loading || error) return <CatalogStatus loading={loading || !loaded} error={error} />;

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
