import { useMemo, useState } from 'react';
import {
  TIME_SAVE_TIERS,
  difficultyStars,
  formatSeconds,
  timeSaveIcons,
  timeSaveTier,
  youtubeId,
} from '../lib/format.js';
import { Card, Select } from './CatalogUI.jsx';

/**
 * Client-side search and filtering over the whole catalogue.
 *
 * The full list is embedded in the page at build time, so filtering is instant
 * and needs no server. Comfortable up to a few thousand entries.
 *
 * Astro server-renders this at build time, so the list is in the HTML for
 * search engines before hydration.
 *
 * Markup is deliberately unstyled. Every element carries a class name.
 */
export default function Catalog({ skips, facets }) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [timesave, setTimesave] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();

    return skips.filter((s) => {
      if (q && !`${s.title} ${s.summary}`.toLowerCase().includes(q)) return false;
      if (level && s.level !== level) return false;
      if (difficulty && s.difficulty !== difficulty) return false;
      if (timesave && String(timeSaveTier(s.timesave)?.watches ?? '') !== timesave)
        return false;
      return true;
    });
  }, [skips, search, level, difficulty, timesave]);

  const hasFilters = search || level || difficulty || timesave;

  function reset() {
    setSearch('');
    setLevel('');
    setDifficulty('');
    setTimesave('');
  }

  return (
    <div className="catalog">
      {/* No <form>: nothing is submitted, filtering is live. */}
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

        <Select
          label="Level"
          value={level}
          onChange={setLevel}
          options={facets.levels}
          allLabel="All"
        />
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={facets.difficulties}
          formatOption={(o) => difficultyStars(o) ?? o}
          allLabel="All"
        />

        <label className="filter">
          <span className="filter__label">Time save</span>
          <select
            className="filter__select"
            value={timesave}
            onChange={(e) => setTimesave(e.target.value)}
          >
            <option value="">All</option>
            {TIME_SAVE_TIERS.map((t) => (
              <option key={t.watches} value={t.watches}>
                {'⌚'.repeat(t.watches)} {t.short}
              </option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button className="filter__reset" type="button" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <p className="catalog__count" aria-live="polite">
        {results.length} skip{results.length > 1 ? 's' : ''}
      </p>

      {results.length === 0 ? (
        <p className="catalog__empty">
          No skip matches. Broaden the filters to see the rest of the
          catalogue.
        </p>
      ) : (
        <ul className="catalog__list">
          {results.map((s) => (
            <SkipCard key={s.id} skip={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Builds the meta list for a skip card/detail: shared shape for the <Card>. */
function skipMeta(s) {
  return [
    s.level && { label: 'Level', value: s.level, attrs: { 'data-level': s.level } },
    s.foundBy && { label: 'Found by', value: s.foundBy },
    s.difficulty && {
      label: 'Difficulty',
      value: difficultyStars(s.difficulty) ?? s.difficulty,
      className: 'card__stars',
      attrs: { 'data-difficulty': s.difficulty },
    },
    s.timesave != null && {
      label: 'Time save',
      value: `${timeSaveIcons(s.timesave)} ${formatSeconds(s.timesave)}`,
      className: 'card__timesave',
      attrs: { title: timeSaveTier(s.timesave)?.label },
    },
  ];
}

/** A single catalogue card, using the linked video's YouTube thumbnail as cover. */
function SkipCard({ skip: s }) {
  const videoId = youtubeId(s.youtubeLink);

  return (
    <Card
      href={`/skips/${s.slug}/`}
      media={videoId ? { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } : null}
      title={s.title}
      summary={s.summary}
      meta={skipMeta(s)}
    />
  );
}
