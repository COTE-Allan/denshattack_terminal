import { ChevronRight, Clock, Download, Star, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { difficultyStarCount, formatSeconds, timeSaveWatchCount } from '../lib/format.js';
import { exportRoute, resolveImportedRoute } from '../lib/routeExport.js';
import { SKIP_SORT_OPTIONS, SKIP_SORTS, filterSkips, groupSkipsByLevel } from '../lib/skipSort.js';
import { useRouteSheet } from '../lib/useRouteSheet.js';
import { IconRow, SortSelect } from './CatalogUI.jsx';

/**
 * Build-your-own route: click skips (as pills, grouped by level and
 * collapsed by default so a big catalogue stays scannable, with
 * search/sort to jump straight to one) to add them to "My route" on the
 * right, then export it as JSON. Not every skip belongs in the same run:
 * some are mutually exclusive alternatives for the same spot, so this
 * doesn't pre-fill anything; it's entirely the visitor's own picks, kept
 * in localStorage (see useRouteSheet.js) so they can come back and refine
 * it before exporting.
 */
export default function RouteSheet({ skips }) {
  const { selected, loaded, toggle, reset, addMany } = useRouteSheet();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('level');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef(null);

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

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportRoute(myRoute), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'denshattack-route.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be re-picked later if needed
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(String(reader.result));
      } catch {
        setImportMessage("Couldn't read that file: it's not valid JSON.");
        return;
      }

      const { ids, skipped } = resolveImportedRoute(data, skips);
      addMany(ids);

      setImportMessage(
        skipped.length === 0
          ? `Imported ${ids.length} skip${ids.length === 1 ? '' : 's'}.`
          : `Imported ${ids.length} skip${ids.length === 1 ? '' : 's'}. ${skipped.length} no longer matched a catalogued skip: ${skipped.join(', ')}.`
      );
    };
    reader.readAsText(file);
  }

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
            <div className="route-sheet__summary-actions">
              {myRoute.length > 0 && (
                <>
                  <button type="button" className="btn" onClick={reset}>
                    <Trash2 size={16} aria-hidden="true" /> Clear
                  </button>
                  <button type="button" className="btn" onClick={handleExport}>
                    <Download size={16} aria-hidden="true" /> Export
                  </button>
                </>
              )}
              <button type="button" className="btn" onClick={handleImportClick}>
                <Upload size={16} aria-hidden="true" /> Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={handleImportFile}
              />
            </div>
          </div>

          {importMessage && <p className="route-sheet__import-message">{importMessage}</p>}

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
