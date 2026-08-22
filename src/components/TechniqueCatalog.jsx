import { useMemo, useState } from 'react';
import { isRecent, youtubeId } from '../lib/format.js';
import { Card } from './CatalogUI.jsx';

/**
 * Same client-side search/filter pattern as Catalog.jsx (skips), over the
 * technique catalogue instead. See Catalog.jsx for the shared reasoning.
 */
export default function TechniqueCatalog({ techniques }) {
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return techniques.map((t) => ({ technique: t, matchedVariant: null }));

    return techniques
      .map((t) => {
        // Search the technique's own text first...
        if (`${t.title} ${t.summary}`.toLowerCase().includes(q)) {
          return { technique: t, matchedVariant: null };
        }
        // ...then each variant's, so a word that only appears in a variant
        // still surfaces the parent technique (variants don't get their own
        // grid entry).
        const matchedVariant = t.variants.find((v) =>
          `${v.title} ${v.summary}`.toLowerCase().includes(q)
        );
        return matchedVariant ? { technique: t, matchedVariant } : null;
      })
      .filter(Boolean);
  }, [techniques, search]);

  const hasFilters = search;

  function reset() {
    setSearch('');
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
          {results.map(({ technique: t, matchedVariant }) => (
            <TechniqueCard key={t.id} technique={t} matchedVariant={matchedVariant} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** A single catalogue card, using the linked video's YouTube thumbnail as cover. */
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
        // The search only matched inside a variant, not the technique's own
        // text, so say which one is why this card is showing up.
        matchedVariant && {
          label: 'Matches variant',
          value: matchedVariant.title,
        },
      ]}
      badge={isRecent(t.modified) ? 'New!' : null}
    />
  );
}
