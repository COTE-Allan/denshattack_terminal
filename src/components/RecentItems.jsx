import { useMemo } from 'react';
import { isRecent, TYPE_LABELS } from '../lib/format.js';
import { useAllContent } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { Card } from './CatalogUI.jsx';
import SkeletonGrid from './SkeletonCard.jsx';

const RECENT_DAYS = 30;

// skips/techniques/stickers added or updated recently, fetched client-side; used on both the homepage teaser and /new
export default function RecentItems({ max, emptyText }) {
  const { data: all, loading, error } = useAllContent();

  const recent = useMemo(() => {
    if (!all) return [];
    const sorted = all
      .filter((i) => isRecent(i.modified, RECENT_DAYS))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    return max ? sorted.slice(0, max) : sorted;
  }, [all, max]);

  if (loading) return <SkeletonGrid count={max ?? 6} />;
  if (error) return <CatalogStatus error={error} />;

  if (recent.length === 0) {
    return emptyText ? <p className="catalog__empty">{emptyText}</p> : null;
  }

  return (
    <ul className="catalog__list">
      {recent.map((i) => (
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
  );
}
