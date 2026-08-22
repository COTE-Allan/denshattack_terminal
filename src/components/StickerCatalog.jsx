import { useMemo, useState } from 'react';
import { isRecent } from '../lib/format.js';
import { Card, Select } from './CatalogUI.jsx';

/**
 * Same client-side search/filter pattern as Catalog.jsx (skips), over the
 * sticker catalogue instead. See Catalog.jsx for the shared reasoning.
 */
export default function StickerCatalog({ stickers, facets }) {
  const [search, setSearch] = useState('');
  const [artist, setArtist] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();

    return stickers.filter((s) => {
      if (q && !`${s.title} ${s.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      if (artist && s.artist !== artist) return false;
      return true;
    });
  }, [stickers, search, artist]);

  const hasFilters = search || artist;

  function reset() {
    setSearch('');
    setArtist('');
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

      <p className="catalog__count" aria-live="polite">
        {results.length} sticker{results.length > 1 ? 's' : ''}
      </p>

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
