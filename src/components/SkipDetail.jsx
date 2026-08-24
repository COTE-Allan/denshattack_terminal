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

// shared between the main skip and each inline variant below it. `baseTimesave` is only passed for a variant:
// its own timesave is extra time saved on top of the base skip's, not a standalone total.
function SkipMeta({ s, baseTimesave }) {
  const tier = timeSaveTier(s.timesave);
  const difficultyCount = difficultyStarCount(s.difficulty);
  const watchCount = timeSaveWatchCount(s.timesave);
  const isIncremental = baseTimesave != null && s.timesave != null;

  return (
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
          <dd
            className="card__timesave"
            title={isIncremental ? `${tier.label} on top of the base skip's time save.` : tier.label}
          >
            <IconRow icon={Clock} count={watchCount} />{' '}
            {isIncremental ? (
              <>
                {formatSeconds(s.timesave).replace('~', '+')}{' '}
                <span className="skip-page__timesave-total">
                  ({formatSeconds(baseTimesave + s.timesave)} total)
                </span>
              </>
            ) : (
              formatSeconds(s.timesave)
            )}
          </dd>
        </>
      )}
      {s.techniqueUsed.length > 0 && (
        <>
          <dt>Techniques used</dt>
          <dd className="skip-page__techniques">
            {s.techniqueUsed.map((t, i) => (
              <span key={t.id}>
                {i > 0 && ', '}
                <a href={`/techniques/${t.slug}/?from=skip:${s.slug}`}>{t.title}</a>
              </span>
            ))}
          </dd>
        </>
      )}
    </dl>
  );
}

function VideoBlock({ title, youtubeLink }) {
  const videoId = youtubeId(youtubeLink);
  const videoStart = youtubeStart(youtubeLink);

  if (videoId) {
    return (
      <div className="detail__video">
        {/* youtube-nocookie: no tracking cookie until the visitor plays */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}${videoStart ? `?start=${videoStart}` : ''}`}
          title={`Demonstration: ${title}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (!youtubeLink) return null;

  return (
    <p className="skip-page__video-link">
      <a className="btn" href={youtubeLink} target="_blank" rel="noopener nofollow">
        Watch the demonstration
      </a>
    </p>
  );
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
  // viewing a variant's own page directly still needs its parent's timesave, to show the same "+extra" framing
  const parent = s.variantOfId ? skips.find((sk) => sk.id === s.variantOfId) : null;

  return (
    <>
      <article>
        <h1 className="detail__title">{s.title}</h1>

        {s.variantOfSlug && (
          <p className="skip-page__variant-of">
            Variant of <a href={`/skips/${s.variantOfSlug}/`}>{s.variantOfTitle}</a>
          </p>
        )}

        <SkipMeta s={s} baseTimesave={parent?.timesave} />

        {/* description comes from the acf wysiwyg field, safe to inject: it only comes from the admin */}
        {s.description && (
          <div className="detail__body" dangerouslySetInnerHTML={{ __html: s.description }} />
        )}

        <VideoBlock title={s.title} youtubeLink={s.youtubeLink} />

        <div className="skip-page__actions">
          <LearnedToggle skipId={s.id} />
          <CopyLinkButton />
        </div>
      </article>

      {s.variants.length > 0 && (
        <section className="skip-page__variants">
          <h2>Variants</h2>

          {s.variants.map((v) => (
            <article key={v.id} className="skip-page__variant">
              <h3>{v.title}</h3>

              <SkipMeta s={v} baseTimesave={s.timesave} />

              {v.description && (
                <div className="detail__body" dangerouslySetInnerHTML={{ __html: v.description }} />
              )}

              <VideoBlock title={v.title} youtubeLink={v.youtubeLink} />
            </article>
          ))}
        </section>
      )}
    </>
  );
}
