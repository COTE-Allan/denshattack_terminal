import { useMemo, useState } from 'react';
import { isRecent, youtubeId } from '../lib/format.js';
import { useTechniques } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { Card, SortSelect } from './CatalogUI.jsx';
import SkeletonGrid from './SkeletonCard.jsx';

const SORTS = {
  name: (a, b) => a.technique.title.localeCompare(b.technique.title, 'fr', { numeric: true }),
  recent: (a, b) => new Date(b.technique.modified) - new Date(a.technique.modified),
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'recent', label: 'Most recent' },
];

// same client-side search/filter pattern as catalog.jsx, over the technique catalogue
export default function TechniqueCatalog() {
  const { data: allTechniques, loading, error } = useTechniques();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');

  // variants have their own page, linked from their parent's — not listed as their own card
  const techniques = useMemo(
    () => (allTechniques ? allTechniques.filter((t) => !t.variantOfId) : []),
    [allTechniques]
  );

  const matched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return techniques.map((t) => ({ technique: t, matchedVariant: null }));

    return techniques
      .map((t) => {
        if (`${t.title} ${t.summary}`.toLowerCase().includes(q)) {
          return { technique: t, matchedVariant: null };
        }
        // then each variant's, so a word only in a variant still surfaces the parent technique
        const matchedVariant = t.variants.find((v) =>
          `${v.title} ${v.summary}`.toLowerCase().includes(q)
        );
        return matchedVariant ? { technique: t, matchedVariant } : null;
      })
      .filter(Boolean);
  }, [techniques, search]);

  const results = useMemo(() => [...matched].sort(SORTS[sort]), [matched, sort]);

  const hasFilters = search;

  function reset() {
    setSearch('');
  }

  if (loading) {
    return (
      <div className="catalog catalog--techniques">
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog catalog--techniques">
        <CatalogStatus error={error} />
      </div>
    );
  }

  return (
    <div className="catalog catalog--techniques">
      <div className="catalog__filters">
        <label className="filter">
          <span className="filter__label">Search</span>
          <input
            className="filter__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, description, or a variant's"
          />
        </label>

        {hasFilters && (
          <button className="filter__reset" type="button" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <div className="catalog__toolbar">
        <p className="catalog__count" aria-live="polite">
          {results.length} technique{results.length > 1 ? 's' : ''}
        </p>

        <SortSelect value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      {results.length === 0 ? (
        <p className="catalog__empty">
          No technique matches. Broaden the filters to see the rest of the
          catalogue.
        </p>
      ) : (
        <ul className="catalog__list">
          {results.map(({ technique: t, matchedVariant }) => (
            <TechniqueCard key={t.id} technique={t} matchedVariant={matchedVariant} />
          ))}
        </ul>
      )}
    </div>
  );
}

// a single catalogue card, using the linked video's youtube thumbnail as cover
function TechniqueCard({ technique: t, matchedVariant }) {
  const videoId = youtubeId(t.youtubeLink);

  return (
    <Card
      href={`/techniques/${t.slug}/`}
      media={videoId ? { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } : null}
      title={t.title}
      summary={matchedVariant ? matchedVariant.summary : t.summary}
      meta={[
        t.variants.length > 0 && {
          label: 'Variants',
          value: t.variants.length,
        },
        // says which variant matched, when the technique's own text didn't
        matchedVariant && {
          label: 'Matches variant',
          value: matchedVariant.title,
        },
      ]}
      badge={isRecent(t.modified) ? 'New!' : null}
    />
  );
}
