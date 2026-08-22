import { Check, Gamepad2 } from 'lucide-react';
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
 *
 * `learned`/`onToggleLearned`, when both set, render a checkmark toggle in
 * the top-right corner (see /practice). It's a sibling of the card's link,
 * not nested inside it — an interactive control inside an <a> is invalid
 * HTML and would fire the card's own navigation on click.
 */
export function Card({ href, media, title, summary, meta = [], badge, learned, onToggleLearned }) {
  const entries = meta.filter(Boolean);

  return (
    <li className="card">
      {onToggleLearned && (
        <button
          type="button"
          className={learned ? 'card__learned-toggle card__learned-toggle--active' : 'card__learned-toggle'}
          onClick={onToggleLearned}
          aria-pressed={learned}
          aria-label={learned ? 'Mark as not learned' : 'Mark as learned'}
          title={learned ? 'Learned' : 'Mark as learned'}
        >
          <Check size={14} aria-hidden="true" />
        </button>
      )}

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
              <Gamepad2 size={32} />
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

/**
 * `count` copies of `Icon` in a row, for a difficulty/time-save rating
 * (e.g. `<IconRow icon={Star} count={3} filled />`). Shared between every
 * React component that renders one (Catalog.jsx, PracticeMode.jsx,
 * RouteSheet.jsx) so they don't each reimplement the same loop. The
 * `.astro` pages with the same rating (skips/[slug].astro) use
 * @lucide/astro directly instead, since they can't import React
 * components.
 */
export function IconRow({ icon: Icon, count, filled = false }) {
  return (
    <Fragment>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} size={14} fill={filled ? 'currentColor' : 'none'} />
      ))}
    </Fragment>
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

/**
 * Sort order picker: unlike <Select>, always has a value (no "all" option)
 * and takes `{ value, label }` options directly since a sort key's label
 * ("Most recent") rarely matches the key itself ("recent").
 */
export function SortSelect({ label = 'Sort by', value, onChange, options }) {
  return (
    <label className="filter">
      <span className="filter__label">{label}</span>
      <select
        className="filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
