import { Award, Clock, Layers, Palette, Sticker, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { formatSeconds } from '../lib/format.js';
import { useSkips, useStickers, useTechniques } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';

// most frequent value of `key` across `items`, with its count, null if none have it
function topContributor(items, key) {
  const counts = new Map();
  for (const item of items) {
    const name = item[key];
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  let top = null;
  for (const [name, count] of counts) {
    if (!top || count > top.count) top = { name, count };
  }
  return top;
}

export default function Stats() {
  const { data: skips, loading: skipsLoading, error: skipsError } = useSkips();
  const { data: techniques, loading: techniquesLoading, error: techniquesError } = useTechniques();
  const { data: stickers, loading: stickersLoading, error: stickersError } = useStickers();

  const loading = skipsLoading || techniquesLoading || stickersLoading;
  const error = skipsError || techniquesError || stickersError;

  const stats = useMemo(() => {
    if (!skips || !techniques || !stickers) return null;

    const baseTechniques = techniques.filter((t) => !t.variantOfId);
    const variantCount = techniques.length - baseTechniques.length;
    const totalTimeSaved = skips.reduce((sum, s) => sum + (s.timesave || 0), 0);

    return {
      skipCount: skips.length,
      baseTechniqueCount: baseTechniques.length,
      variantCount,
      stickerCount: stickers.length,
      totalTimeSaved,
      topFinder: topContributor(skips, 'foundBy'),
      topArtist: topContributor(stickers, 'artist'),
    };
  }, [skips, techniques, stickers]);

  if (loading || error || !stats) return <CatalogStatus loading={loading || !stats} error={error} />;

  return (
    <ul className="stat-grid">
      <li className="stat-tile">
        <p className="stat-tile__label"><Zap size={14} aria-hidden="true" /> Skips catalogued</p>
        <p className="stat-tile__value">{stats.skipCount}</p>
      </li>

      <li className="stat-tile">
        <p className="stat-tile__label"><Layers size={14} aria-hidden="true" /> Techniques catalogued</p>
        <p className="stat-tile__value">{stats.baseTechniqueCount}</p>
        {stats.variantCount > 0 && (
          <p className="stat-tile__caption">
            + {stats.variantCount} variant{stats.variantCount > 1 ? 's' : ''}
          </p>
        )}
      </li>

      <li className="stat-tile">
        <p className="stat-tile__label"><Sticker size={14} aria-hidden="true" /> Stickers submitted</p>
        <p className="stat-tile__value">{stats.stickerCount}</p>
      </li>

      <li className="stat-tile">
        <p className="stat-tile__label"><Clock size={14} aria-hidden="true" /> Total time saved</p>
        <p className="stat-tile__value">
          {stats.totalTimeSaved > 0 ? formatSeconds(stats.totalTimeSaved) : 'N/A'}
        </p>
        <p className="stat-tile__caption">Across every catalogued skip</p>
      </li>

      <li className="stat-tile">
        <p className="stat-tile__label"><Award size={14} aria-hidden="true" /> Top skip finder</p>
        <p className="stat-tile__value">{stats.topFinder?.name ?? 'N/A'}</p>
        {stats.topFinder && (
          <p className="stat-tile__caption">
            {stats.topFinder.count} skip{stats.topFinder.count > 1 ? 's' : ''} found
          </p>
        )}
      </li>

      <li className="stat-tile">
        <p className="stat-tile__label"><Palette size={14} aria-hidden="true" /> Top sticker artist</p>
        <p className="stat-tile__value">{stats.topArtist?.name ?? 'N/A'}</p>
        {stats.topArtist && (
          <p className="stat-tile__caption">
            {stats.topArtist.count} sticker{stats.topArtist.count > 1 ? 's' : ''} made
          </p>
        )}
      </li>
    </ul>
  );
}
