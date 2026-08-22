import { Fragment } from 'react';

/**
 * Shared building blocks for every catalogue (skips, stickers, ...): the
 * card grid item and the filter dropdown. Kept generic on purpose so new
 * catalogues can reuse them instead of re-implementing card markup.
 */

/**
 * One grid card: cover media (or a placeholder, so every card keeps the
 * same media-slot height even without a thumbnail), title, optional
 * summary, and a list of meta facts rendered as a definition list.
 *
 * `meta` entries: { label, value, className?, attrs? }. `attrs` is spread
 * onto the <dd>, used for styling hooks like data-level, or a title
 * attribute for a tooltip. Falsy entries in `meta` are skipped, so callers
 * can write `s.level && { label: 'Level', value: s.level }` inline.
 *
 * `badge`, when set, renders a small pill over the top-left of the media
 * slot (e.g. "New").
 */
export function Card({ href, media, title, summary, meta = [], badge }) {
  const entries = meta.filter(Boolean);

  return (
    <li className="card">
      <a className="card__link" href={href}>
        <div className="card__media">
          {badge && <span className="card__badge">{badge}</span>}

          {media?.src ? (
            <img
              className="card__media-thumb"
              src={media.src}
              alt={media.alt || ''}
              loading="lazy"
            />
          ) : (
            <div className="card__media-placeholder" aria-hidden="true">
              🎮
            </div>
          )}
        </div>

        <div className="card__body">
          <h2 className="card__title">{title}</h2>

          {summary && <p className="card__summary">{summary}</p>}

          {entries.length > 0 && (
            <dl className="card__meta">
              {entries.map((m) => (
                <Fragment key={m.label}>
                  <dt className="card__meta-label">{m.label}</dt>
                  <dd
                    className={m.className ? `card__meta-value ${m.className}` : 'card__meta-value'}
                    {...(m.attrs || {})}
                  >
                    {m.value}
                  </dd>
                </Fragment>
              ))}
            </dl>
          )}
        </div>
      </a>
    </li>
  );
}

/** A labelled <select> filter, with an "all" option and optional per-option formatting. */
export function Select({ label, value, onChange, options, allLabel, formatOption = (o) => o }) {
  if (!options.length) return null;

  return (
    <label className="filter">
      <span className="filter__label">{label}</span>
      <select
        className="filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {formatOption(o)}
          </option>
        ))}
      </select>
    </label>
  );
}
