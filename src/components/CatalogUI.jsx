import { Fragment } from 'react';

/**
 * Shared building blocks for every catalogue (skips, stickers, ...): the
 * card grid item and the filter dropdown. Kept generic on purpose so new
 * catalogues can reuse them instead of re-implementing card markup.
 */

/**
 * One grid card: optional cover media, title, optional summary, and a list
 * of meta facts rendered as a definition list.
 *
 * `meta` entries: { label, value, className?, attrs? }. `attrs` is spread
 * onto the <dd>, used for styling hooks like data-level, or a title
 * attribute for a tooltip. Falsy entries in `meta` are skipped, so callers
 * can write `s.level && { label: 'Level', value: s.level }` inline.
 */
export function Card({ href, media, title, summary, meta = [] }) {
  const entries = meta.filter(Boolean);

  return (
    <li className="card">
      <a className="card__link" href={href}>
        {media?.src && (
          <div className="card__media">
            <img
              className="card__media-thumb"
              src={media.src}
              alt={media.alt || ''}
              loading="lazy"
            />
          </div>
        )}

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
