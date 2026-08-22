import { useMemo, useState } from 'react';
import { youtubeId } from '../lib/format.js';
import { Card } from './CatalogUI.jsx';

/**
 * Same client-side search/filter pattern as Catalog.jsx (skips), over the
 * technique catalogue instead. See Catalog.jsx for the shared reasoning.
 */
export default function TechniqueCatalog({ techniques }) {
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();

    return techniques.filter((t) => {
      if (q && !`${t.title} ${t.summary}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [techniques, search]);

  const hasFilters = search;

  function reset() {
    setSearch('');
  }

  return (
    <div className="catalog">
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

        {hasFilters && (
          <button className="filter__reset" type="button" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <p className="catalog__count" aria-live="polite">
        {results.length} technique{results.length > 1 ? 's' : ''}
      </p>

      {results.length === 0 ? (
        <p className="catalog__empty">
          No technique matches. Broaden the filters to see the rest of the
          catalogue.
        </p>
      ) : (
        <ul className="catalog__list">
          {results.map((t) => (
            <TechniqueCard key={t.id} technique={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** A single catalogue card, using the linked video's YouTube thumbnail as cover. */
function TechniqueCard({ technique: t }) {
  const videoId = youtubeId(t.youtubeLink);

  return (
    <Card
      href={`/techniques/${t.slug}/`}
      media={videoId ? { src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` } : null}
      title={t.title}
      summary={t.summary}
      meta={[
        t.variants.length > 0 && {
          label: 'Variants',
          value: t.variants.length,
        },
      ]}
    />
  );
}
