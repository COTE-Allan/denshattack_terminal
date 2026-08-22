import { ChevronRight, Clock, Printer, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { difficultyStarCount, formatSeconds, timeSaveWatchCount } from '../lib/format.js';
import { SKIP_SORT_OPTIONS, SKIP_SORTS, filterSkips, groupSkipsByLevel } from '../lib/skipSort.js';
import { useRouteSheet } from '../lib/useRouteSheet.js';
import { IconRow, SortSelect } from './CatalogUI.jsx';

/**
 * Build-your-own route: click skips (as pills, grouped by level and
 * collapsed by default so a big catalogue stays scannable, with
 * search/sort to jump straight to one) to add them to "My route" on the
 * right, then print that list. Not every skip belongs in the same run:
 * some are mutually exclusive alternatives for the same spot, so this
 * doesn't pre-fill anything; it's entirely the visitor's own picks, kept
 * in localStorage (see useRouteSheet.js) so they can come back and refine
 * it before printing.
 */
export default function RouteSheet({ skips }) {
  const { selected, loaded, toggle, reset } = useRouteSheet();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('level');

  const filtered = useMemo(() => filterSkips(skips, search), [skips, search]);
  const grouped = sort === 'level' ? groupSkipsByLevel(filtered) : null;
  const flat = sort === 'level' ? null : [...filtered].sort(SKIP_SORTS[sort]);
  // Groups auto-expand while searching, so a match isn't hidden behind a
  // collapsed level; left alone (browser-native, uncontrolled) otherwise,
  // so a level the visitor opened by hand stays open.
  const forceOpen = search.trim() !== '' ? true : undefined;

  // Always in level order, regardless of the picker's own search/sort: a
  // route sheet should read like the run plays out, not however it was
  // last searched to build it.
  const myRoute = useMemo(() => skips.filter((s) => selected.has(s.id)), [skips, selected]);
  const totalTimeSaved = useMemo(
    () => myRoute.reduce((sum, s) => sum + (s.timesave || 0), 0),
    [myRoute]
  );

  if (!loaded) return null;

  return (
    <div className="route-sheet">
      <p className="route-sheet__note">
        Click a skip to add it to your route. Some skips are alternatives
        for the same spot and won't both make sense in one run: pick
        whichever you're actually going for.
      </p>

      <div className="route-sheet__layout">
        <div className="route-sheet__picker">
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

          {filtered.length === 0 ? (
            <p className="catalog__empty">No skip matches. Try a different search.</p>
          ) : grouped ? (
            <div className="route-sheet__picker-levels">
              {grouped.map(({ level, skips: levelSkips }) => (
                <details
                  key={level || 'unlisted'}
                  className="route-sheet__picker-level"
                  open={forceOpen}
                >
                  <summary>
                    <ChevronRight
                      size={14}
                      className="route-sheet__picker-chevron"
                      aria-hidden="true"
                    />
                    {level || 'Unlisted'} ({levelSkips.length})
                  </summary>
                  <SkipPills skips={levelSkips} selected={selected} onToggle={toggle} />
                </details>
              ))}
            </div>
          ) : (
            <SkipPills skips={flat} selected={selected} onToggle={toggle} />
          )}
        </div>

        <div className="route-sheet__summary">
          <div className="page-header">
            <h2>
              My route ({myRoute.length} skip{myRoute.length === 1 ? '' : 's'})
            </h2>
            {myRoute.length > 0 && (
              <div className="route-sheet__summary-actions">
                <button type="button" className="btn" onClick={() => window.print()}>
                  <Printer size={16} aria-hidden="true" /> Print
                </button>
                <button type="button" className="btn" onClick={reset}>
                  <Trash2 size={16} aria-hidden="true" /> Clear
                </button>
              </div>
            )}
          </div>

          {myRoute.length > 0 && (
            <p className="route-sheet__total-timesave">
              Estimated time saved: {formatSeconds(totalTimeSaved)}
            </p>
          )}

          {myRoute.length === 0 ? (
            <p className="catalog__empty">
              No skips picked yet: click some on the left to build your route.
            </p>
          ) : (
            <ol className="route-sheet__list">
              {myRoute.map((s) => {
                const difficultyCount = difficultyStarCount(s.difficulty);
                const watchCount = timeSaveWatchCount(s.timesave);

                return (
                  <li key={s.id} className="route-sheet__skip">
                    <h3>
                      <a href={`/skips/${s.slug}/?from=route-sheet`}>{s.title}</a>
                    </h3>
                    <p className="route-sheet__meta">
                      {s.level}
                      {difficultyCount > 0 && (
                        <span className="route-sheet__meta-stars">
                          <IconRow icon={Star} count={difficultyCount} filled />
                        </span>
                      )}
                      {s.timesave != null && (
                        <span className="route-sheet__meta-time">
                          <IconRow icon={Clock} count={watchCount} /> {formatSeconds(s.timesave)}
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function SkipPills({ skips, selected, onToggle }) {
  return (
    <ul className="pill-list">
      {skips.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            className={selected.has(s.id) ? 'pill pill--compact pill--active' : 'pill pill--compact'}
            aria-pressed={selected.has(s.id)}
            onClick={() => onToggle(s.id)}
          >
            {s.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
