import { Clock, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  TIME_SAVE_TIERS,
  difficultyStarCount,
  formatSeconds,
  isRecent,
  timeSaveTier,
  timeSaveWatchCount,
  youtubeId,
} from '../lib/format.js';
import { useLearnedSkips } from '../lib/useLearned.js';
import { useSkips } from '../lib/useContent.js';
import { facet } from '../lib/wp.js';
import CatalogStatus from './CatalogStatus.jsx';
import { Card, IconRow, Select, SortSelect } from './CatalogUI.jsx';
import SkeletonGrid from './SkeletonCard.jsx';

// plain-text fallback for the difficulty <select>: <option> can't hold svg icons
function difficultyOptionLabel(difficulty) {
  const n = difficultyStarCount(difficulty);
  return n > 0 ? '★'.repeat(n) : difficulty;
}

const SORTS = {
  level: (a, b) =>
    a.level.localeCompare(b.level, 'fr', { numeric: true }) ||
    a.title.localeCompare(b.title, 'fr', { numeric: true }),
  name: (a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }),
  recent: (a, b) => new Date(b.modified) - new Date(a.modified),
  difficulty: (a, b) => Number(b.difficulty || 0) - Number(a.difficulty || 0),
  timesave: (a, b) => (b.timesave ?? -1) - (a.timesave ?? -1),
};

const SORT_OPTIONS = [
  { value: 'level', label: 'Level' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'recent', label: 'Most recent' },
  { value: 'difficulty', label: 'Difficulty (hardest first)' },
  { value: 'timesave', label: 'Time save (biggest first)' },
];

// fetches the whole catalogue client-side, so the deployed site never needs a rebuild for new wordpress entries
export default function Catalog() {
  const { data: allSkips, loading, error } = useSkips();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [timesave, setTimesave] = useState('');
  const [sort, setSort] = useState('level');
  const { learned, toggle: toggleLearned } = useLearnedSkips();

  // variants have their own page, linked from their parent's — not listed as their own card
  const skips = useMemo(
    () => (allSkips ? allSkips.filter((s) => !s.variantOfId) : []),
    [allSkips]
  );

  const facets = useMemo(
    () => ({
      levels: skips ? facet(skips, 'level') : [],
      difficulties: skips ? facet(skips, 'difficulty') : [],
    }),
    [skips]
  );

  // a search term matching only a variant's title/summary still surfaces its base skip (the variant has no card of
  // its own), same as the technique catalogue does for technique variants
  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skips.map((s) => ({ skip: s, matchedVariant: null }));

    return skips
      .map((s) => {
        if (`${s.title} ${s.summary}`.toLowerCase().includes(q)) {
          return { skip: s, matchedVariant: null };
        }
        const matchedVariant = s.variants.find((v) =>
          `${v.title} ${v.summary}`.toLowerCase().includes(q)
        );
        return matchedVariant ? { skip: s, matchedVariant } : null;
      })
      .filter(Boolean);
  }, [skips, search]);

  const filtered = useMemo(() => {
    return matched.filter(({ skip: s }) => {
      if (level && s.level !== level) return false;
      if (difficulty && s.difficulty !== difficulty) return false;
      if (timesave && String(timeSaveTier(s.timesave)?.watches ?? '') !== timesave)
        return false;
      return true;
    });
  }, [matched, level, difficulty, timesave]);

  const results = useMemo(
    () => [...filtered].sort((a, b) => SORTS[sort](a.skip, b.skip)),
    [filtered, sort]
  );

  const hasFilters = search || level || difficulty || timesave;

  function reset() {
    setSearch('');
    setLevel('');
    setDifficulty('');
    setTimesave('');
  }

  if (loading) {
    return (
      <div className="catalog catalog--skips">
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog catalog--skips">
        <CatalogStatus error={error} />
      </div>
    );
  }

  return (
    <div className="catalog catalog--skips">
      {/* no <form>: nothing is submitted, filtering is live */}
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
          formatOption={difficultyOptionLabel}
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
                {'●'.repeat(t.watches)} {t.short}
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

      <div className="catalog__toolbar">
        <p className="catalog__count" aria-live="polite">
          {results.length} skip{results.length > 1 ? 's' : ''}
        </p>

        <SortSelect value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      <div className="catalog__learned-progress">
        <p>
          {learned.size} / {skips.length} learned
        </p>
        <div className="catalog__learned-bar">
          <div
            className="catalog__learned-bar-fill"
            style={{ width: `${skips.length ? (learned.size / skips.length) * 100 : 0}%` }}
          />
        </div>
        <a className="catalog__learned-link" href="/practice">
          Practice mode
        </a>
      </div>

      {results.length === 0 ? (
        <p className="catalog__empty">
          No skip matches. Broaden the filters to see the rest of the
          catalogue.
        </p>
      ) : (
        <ul className="catalog__list">
          {results.map(({ skip: s, matchedVariant }) => (
            <SkipCard
              key={s.id}
              skip={s}
              matchedVariant={matchedVariant}
              learned={learned.has(s.id)}
              onToggleLearned={() => toggleLearned(s.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// builds the meta list for a skip card/detail: shared shape for the <card>. `matchedVariant` is only passed from
// the catalogue, when a search term matched a variant instead of the skip itself
function skipMeta(s, matchedVariant) {
  const difficultyCount = difficultyStarCount(s.difficulty);
  const watchCount = timeSaveWatchCount(s.timesave);

  return [
    s.level && { label: 'Level', value: s.level, attrs: { 'data-level': s.level } },
    s.foundBy && { label: 'Found by', value: s.foundBy },
    s.difficulty && {
      label: 'Difficulty',
      value:
        difficultyCount > 0 ? (
          <IconRow icon={Star} count={difficultyCount} filled />
        ) : (
          s.difficulty
        ),
      className: 'card__stars',
      attrs: { 'data-difficulty': s.difficulty },
    },
    s.timesave != null && {
      label: 'Time save',
      value: (
        <>
          <IconRow icon={Clock} count={watchCount} /> {formatSeconds(s.timesave)}
        </>
      ),
      className: 'card__timesave',
      attrs: { title: timeSaveTier(s.timesave)?.label },
    },
    // when a variant is what matched the search, its name replaces the count right here instead of adding a row
    {
      label: 'Variants',
      value: matchedVariant ? matchedVariant.title : s.variants.length > 0 ? s.variants.length : '–',
    },
  ];
}

// a single catalogue card, using the linked video's youtube thumbnail as cover
function SkipCard({ skip: s, matchedVariant, learned, onToggleLearned }) {
  const videoId = youtubeId(s.youtubeLink);

  return (
    <Card
      href={`/skips/${s.slug}/`}
      media={videoId ? { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } : null}
      title={s.title}
      summary={matchedVariant ? matchedVariant.summary : s.summary}
      meta={skipMeta(s, matchedVariant)}
      badge={isRecent(s.modified) ? 'New!' : null}
      learned={learned}
      onToggleLearned={onToggleLearned}
    />
  );
}
