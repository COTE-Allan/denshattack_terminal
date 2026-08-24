import { useMemo, useState } from 'react';
import { isRecent } from '../lib/format.js';
import { useStickers } from '../lib/useContent.js';
import { facet, featuredStickerTags } from '../lib/wp.js';
import CatalogStatus from './CatalogStatus.jsx';
import { Card, Select, SortSelect } from './CatalogUI.jsx';
import SkeletonGrid from './SkeletonCard.jsx';

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

// same client-side search/filter pattern as catalog.jsx, over the sticker catalogue
export default function StickerCatalog() {
  const { data: stickers, loading, error } = useStickers();
  const [search, setSearch] = useState('');
  const [artist, setArtist] = useState('');
  const [sort, setSort] = useState('name');

  const facets = useMemo(
    () => ({
      artists: stickers ? facet(stickers, 'artist') : [],
      tags: stickers ? featuredStickerTags(stickers) : [],
    }),
    [stickers]
  );

  const filtered = useMemo(() => {
    if (!stickers) return [];
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

  // reuses the same search box's matching logic, no separate tag filter needed
  function searchTag(tag) {
    setSearch((current) => (current.trim().toLowerCase() === tag.toLowerCase() ? '' : tag));
  }

  if (loading) {
    return (
      <div className="catalog catalog--stickers">
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog catalog--stickers">
        <CatalogStatus error={error} />
      </div>
    );
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
