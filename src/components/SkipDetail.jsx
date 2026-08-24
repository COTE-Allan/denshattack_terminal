import { Clock, Star } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
  difficultyStarCount,
  formatSeconds,
  timeSaveTier,
  timeSaveWatchCount,
  youtubeId,
  youtubeStart,
} from '../lib/format.js';
import { useSkips } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { IconRow } from './CatalogUI.jsx';
import { CopyLinkButton, LearnedToggle } from './DetailWidgets.jsx';

// no build-time route param: the slug comes from wherever apache's rewrite sent this shell page
function slugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export default function SkipDetail() {
  const { data: skips, loading, error } = useSkips();

  const skip = useMemo(() => {
    if (!skips) return null;
    return skips.find((s) => s.slug === slugFromPath()) ?? null;
  }, [skips]);

  useEffect(() => {
    if (skip) document.title = `Denshattack Station - ${skip.title}`;
  }, [skip]);

  if (loading || error) return <CatalogStatus loading={loading} error={error} />;
  if (!skip) return <p className="catalog__empty">Skip not found.</p>;

  const s = skip;
  const videoId = youtubeId(s.youtubeLink);
  const videoStart = youtubeStart(s.youtubeLink);
  const tier = timeSaveTier(s.timesave);
  const difficultyCount = difficultyStarCount(s.difficulty);
  const watchCount = timeSaveWatchCount(s.timesave);

  return (
    <article>
      <h1 className="detail__title">{s.title}</h1>

      <dl className="detail__meta">
        {s.level && (
          <>
            <dt>Level</dt>
            <dd data-level={s.level}>{s.level}</dd>
          </>
        )}
        {s.foundBy && (
          <>
            <dt>Found by</dt>
            <dd>{s.foundBy}</dd>
          </>
        )}
        {s.difficulty && (
          <>
            <dt>Difficulty</dt>
            <dd className="card__stars" data-difficulty={s.difficulty}>
              {difficultyCount > 0 ? <IconRow icon={Star} count={difficultyCount} filled /> : s.difficulty}
            </dd>
          </>
        )}
        {tier && (
          <>
            <dt>Time save</dt>
            <dd className="card__timesave" title={tier.label}>
              <IconRow icon={Clock} count={watchCount} /> {formatSeconds(s.timesave)}
            </dd>
          </>
        )}
      </dl>

      {/* description comes from the acf wysiwyg field, safe to inject: it only comes from the admin */}
      {s.description && (
        <div className="detail__body" dangerouslySetInnerHTML={{ __html: s.description }} />
      )}

      {videoId ? (
        <div className="detail__video">
          {/* youtube-nocookie: no tracking cookie until the visitor plays */}
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}${videoStart ? `?start=${videoStart}` : ''}`}
            title={`Demonstration: ${s.title}`}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        s.youtubeLink && (
          <p className="skip-page__video-link">
            <a className="btn" href={s.youtubeLink} target="_blank" rel="noopener nofollow">
              Watch the demonstration
            </a>
          </p>
        )
      )}

      <div className="skip-page__actions">
        <LearnedToggle skipId={s.id} />
        <CopyLinkButton />
      </div>
    </article>
  );
}
