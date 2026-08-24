import { useEffect, useMemo, useState } from 'react';
import { TYPE_LABELS } from '../lib/format.js';
import { useAllContent } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { Card } from './CatalogUI.jsx';
import SkeletonGrid from './SkeletonCard.jsx';

// site-wide search over every skip/technique/sticker, fetched client-side so it's always current
export default function SearchResults() {
  const { data: items, loading, error } = useAllContent();
  const [search, setSearch] = useState('');

  // static site: ?q= can only be read client-side after mount, so start from '' to avoid a hydration mismatch
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !items) return [];
    return items.filter((i) => `${i.title} ${i.summary}`.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="catalog catalog--search">
      <div className="catalog__filters">
        <label className="filter">
          <span className="filter__label">Search everything</span>
          <input
            className="filter__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Skips, techniques, stickers…"
            autoFocus
          />
        </label>
      </div>

      {search.trim() === '' ? (
        <p className="catalog__empty">Type something to search across the whole site.</p>
      ) : loading ? (
        <SkeletonGrid />
      ) : error ? (
        <CatalogStatus error={error} />
      ) : (
        <>
          <p className="catalog__count" aria-live="polite">
            {results.length} result{results.length > 1 ? 's' : ''}
          </p>

          {results.length === 0 ? (
            <p className="catalog__empty">No matches. Try a different word.</p>
          ) : (
            <ul className="catalog__list">
              {results.map((i) => (
                <Card
                  key={`${i.type}-${i.href}`}
                  href={i.href}
                  media={i.mediaSrc ? { src: i.mediaSrc } : null}
                  title={i.title}
                  summary={i.summary}
                  meta={[{ label: 'Type', value: TYPE_LABELS[i.type] }]}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
