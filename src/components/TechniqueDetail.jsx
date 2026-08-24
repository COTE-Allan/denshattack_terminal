import { useEffect, useMemo } from 'react';
import { youtubeId, youtubeStart } from '../lib/format.js';
import { useTechniques } from '../lib/useContent.js';
import CatalogStatus from './CatalogStatus.jsx';
import { CopyLinkButton } from './DetailWidgets.jsx';

function slugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
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
    <p className="technique-page__video-link">
      <a className="btn" href={youtubeLink} target="_blank" rel="noopener nofollow">
        Watch the demonstration
      </a>
    </p>
  );
}

export default function TechniqueDetail() {
  const { data: techniques, loading, error } = useTechniques();

  const technique = useMemo(() => {
    if (!techniques) return null;
    return techniques.find((t) => t.slug === slugFromPath()) ?? null;
  }, [techniques]);

  useEffect(() => {
    if (technique) document.title = `Denshattack Station - ${technique.title}`;
  }, [technique]);

  if (loading || error) return <CatalogStatus loading={loading} error={error} />;
  if (!technique) return <p className="catalog__empty">Technique not found.</p>;

  const t = technique;

  return (
    <>
      <article>
        <h1 className="detail__title">{t.title}</h1>

        {t.variantOfSlug && (
          <p className="technique-page__variant-of">
            Variant of <a href={`/techniques/${t.variantOfSlug}/`}>{t.variantOfTitle}</a>
          </p>
        )}

        {/* description comes from the acf wysiwyg field, safe to inject: it only comes from the admin */}
        {t.description && (
          <div className="detail__body" dangerouslySetInnerHTML={{ __html: t.description }} />
        )}

        <VideoBlock title={t.title} youtubeLink={t.youtubeLink} />

        <CopyLinkButton />
      </article>

      {t.variants.length > 0 && (
        <section className="technique-page__variants">
          <h2>Variants</h2>

          {t.variants.map((v) => (
            <article key={v.id} className="technique-page__variant">
              <h3>{v.title}</h3>

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
