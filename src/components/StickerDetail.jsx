import { useEffect, useMemo } from 'react';
import { useStickers } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { CopyLinkButton } from './DetailWidgets.jsx';

function slugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export default function StickerDetail() {
  const { data: stickers, loading, error } = useStickers();

  const sticker = useMemo(() => {
    if (!stickers) return null;
    return stickers.find((s) => s.slug === slugFromPath()) ?? null;
  }, [stickers]);

  useEffect(() => {
    if (sticker) document.title = `Denshattack Station - ${sticker.title}`;
  }, [sticker]);

  if (loading || error) return <CatalogStatus loading={loading} error={error} />;
  if (!sticker) return <p className="catalog__empty">Sticker not found.</p>;

  const s = sticker;

  return (
    <article>
      <h1 className="detail__title">{s.title}</h1>

      <dl className="detail__meta">
        {s.artist && (
          <>
            <dt>Artist</dt>
            <dd>{s.artist}</dd>
          </>
        )}
        {s.tags.length > 0 && (
          <>
            <dt>Tags</dt>
            <dd>{s.tags.join(', ')}</dd>
          </>
        )}
      </dl>

      {s.screenshot && (
        <img
          className="detail__media"
          src={s.screenshot}
          alt={s.screenshotAlt || ''}
          loading="lazy"
          decoding="async"
        />
      )}

      {s.image && (
        <div className="detail__download">
          <img
            className="detail__download-preview"
            src={s.image}
            alt={s.imageAlt || ''}
            loading="lazy"
            decoding="async"
          />
          {/* `download` only forces a save when same-origin; here it just opens in a new tab instead */}
          <a className="btn" href={s.image} download target="_blank" rel="noopener">
            Download sticker
          </a>
        </div>
      )}

      <CopyLinkButton />
    </article>
  );
}
