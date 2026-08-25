import { useEffect, useMemo } from 'react';
import { youtubeId, youtubeStart } from '../lib/format.js';
import { useSkips, useTechniques } from '../lib/useContent.js';
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
  const { data: skips } = useSkips();

  const technique = useMemo(() => {
    if (!techniques) return null;
    return techniques.find((t) => t.slug === slugFromPath()) ?? null;
  }, [techniques]);

  // reverse lookup: which skips (base or variant) reference this technique's family — the technique itself, plus
  // whichever of the base/variants are its siblings, so a variant's usage still surfaces on the base's page and vice versa
  const usedInSkips = useMemo(() => {
    if (!skips || !techniques || !technique) return [];

    const base = technique.variantOfId
      ? techniques.find((x) => x.id === technique.variantOfId)
      : technique;
    const familyIds = new Set([technique.id, base?.id, ...(base?.variants.map((v) => v.id) ?? [])]);

    return skips.filter((s) => s.techniqueUsed.some((tu) => familyIds.has(tu.id)));
  }, [skips, techniques, technique]);

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

      {/* at the bottom, wrapped as pills: a well-used technique can turn up in a lot of skips */}
      {usedInSkips.length > 0 && (
        <section className="technique-page__used-in">
          <h2>Used in</h2>

          <ul className="pill-list">
            {usedInSkips.map((s) => (
              <li key={s.id}>
                <a className="pill" href={`/skips/${s.slug}/?from=technique:${t.slug}`}>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
