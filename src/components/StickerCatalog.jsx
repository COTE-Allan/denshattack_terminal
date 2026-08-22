import { useMemo, useState } from 'react';
import { isRecent } from '../lib/format.js';
import { Card, Select, SortSelect } from './CatalogUI.jsx';

const SORTS = {
  name: (a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }),
  recent: (a, b) => new Date(b.modified) - new Date(a.modified),
  artist: (a, b) => (a.artist || '').localeCompare(b.artist || '', 'fr', { numeric: true }),
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'recent', label: 'Most recent' },
  { value: 'artist', label: 'Artist (A–Z)' },
];

/**
 * Same client-side search/filter pattern as Catalog.jsx (skips), over the
 * sticker catalogue instead. See Catalog.jsx for the shared reasoning.
 */
export default function StickerCatalog({ stickers, facets }) {
  const [search, setSearch] = useState('');
  const [artist, setArtist] = useState('');
  const [sort, setSort] = useState('name');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return stickers.filter((s) => {
      if (q && !`${s.title} ${s.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      if (artist && s.artist !== artist) return false;
      return true;
    });
  }, [stickers, search, artist]);

  const results = useMemo(() => [...filtered].sort(SORTS[sort]), [filtered, sort]);

  const hasFilters = search || artist;

  function reset() {
    setSearch('');
    setArtist('');
  }

  // Clicking a tag pill just runs it through the same search box the
  // "Name or tag" input already filters on, so it doesn't need its own
  // separate matching logic.
  function searchTag(tag) {
    setSearch((current) => (current.trim().toLowerCase() === tag.toLowerCase() ? '' : tag));
  }

  return (
    <div className="catalog catalog--stickers">
      <div className="catalog__filters">
        <label className="filter">
          <span className="filter__label">Search</span>
          <input
            className="filter__input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or tag"
          />
        </label>

        <Select
          label="Artist"
          value={artist}
          onChange={setArtist}
          options={facets.artists}
          allLabel="All"
        />

        {hasFilters && (
          <button className="filter__reset" type="button" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      {facets.tags.length > 0 && (
        <ul className="pill-list">
          {facets.tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                className={
                  search.trim().toLowerCase() === tag.toLowerCase() ? 'pill pill--active' : 'pill'
                }
                onClick={() => searchTag(tag)}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="catalog__toolbar">
        <p className="catalog__count" aria-live="polite">
          {results.length} sticker{results.length > 1 ? 's' : ''}
        </p>

        <SortSelect value={sort} onChange={setSort} options={SORT_OPTIONS} />
      </div>

      {results.length === 0 ? (
        <p className="catalog__empty">
          No sticker matches. Broaden the filters to see the rest of the
          catalogue.
        </p>
      ) : (
        <ul className="catalog__list">
          {results.map((s) => (
            <Card
              key={s.id}
              href={`/stickers/${s.slug}/`}
              media={s.screenshot ? { src: s.screenshot, alt: s.screenshotAlt } : null}
              title={s.title}
              meta={[
                s.artist && { label: 'Artist', value: s.artist },
                s.tags.length > 0 && {
                  label: 'Tags',
                  value: s.tags.join(', '),
                  className: 'card__meta-value--truncate',
                  attrs: { title: s.tags.join(', ') },
                },
              ]}
              badge={isRecent(s.modified) ? 'New!' : null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
