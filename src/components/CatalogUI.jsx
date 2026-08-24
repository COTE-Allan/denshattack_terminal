import { Check, Gamepad2 } from 'lucide-react';
import { Fragment } from 'react';

// shared building blocks for every catalogue: the card grid item and the filter dropdown

// one grid card: media (or placeholder), title, summary, meta facts; `meta` entries are { label, value, className?, attrs? }, falsy ones skipped
export function Card({ href, media, title, summary, meta = [], badge, learned, onToggleLearned }) {
  const entries = meta.filter(Boolean);

  return (
    <li className="card">
      {/* sibling of the link, not nested — a control inside <a> is invalid html */}
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
              decoding="async"
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

// `count` copies of `icon` in a row, for a difficulty/time-save rating; shared across the react catalogue components
export function IconRow({ icon: Icon, count, filled = false }) {
  return (
    <Fragment>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} size={14} fill={filled ? 'currentColor' : 'none'} />
      ))}
    </Fragment>
  );
}

// a labelled <select> filter, with an "all" option and optional per-option formatting
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

// sort order picker: unlike <select>, always has a value and takes `{ value, label }` options directly
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
