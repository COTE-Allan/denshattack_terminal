import { useEffect, useMemo, useState } from 'react';
import { TYPE_LABELS } from '../lib/format.js';
import { Card } from './CatalogUI.jsx';

/**
 * Site-wide search over every skip, technique, and sticker at once. The
 * combined list is embedded at build time (see search.astro / getAllContent
 * in wp.js), so this is instant client-side filtering, same pattern as each
 * catalogue's own search — just over all three types together.
 */
export default function SearchResults({ items }) {
  const [search, setSearch] = useState('');

  // This is a static site: the ?q= a visitor arrives with can only be read
  // client-side, after mount, from the real browser URL — Astro can't see
  // it at build time. Starting from '' and updating in an effect (rather
  // than reading location.search in useState's initializer) keeps the
  // server-rendered and first client render identical, avoiding a
  // hydration mismatch on the input's value.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
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
