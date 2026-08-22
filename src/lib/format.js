/** Shared display helpers for skip cards and detail pages. */

export const TIME_SAVE_TIERS = [
  { max: 10, watches: 1, short: '1–10s', label: 'Around 1 to 10 seconds of time save.' },
  { max: 30, watches: 2, short: '10–30s', label: 'Around 10 to 30 seconds of time save.' },
  { max: 60, watches: 3, short: '30–60s', label: 'Around 30 to 60 seconds of time save.' },
  { max: 180, watches: 4, short: '1–3m', label: 'Around 1 to 3 minutes of time save.' },
  { max: Infinity, watches: 5, short: '3m+', label: 'More than 3 minutes of time save.' },
];

/**
 * Maps a time save in seconds to a watch-icon tier.
 * Returns null when the value isn't a usable number.
 */
export function timeSaveTier(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return (
    TIME_SAVE_TIERS.find((t) => seconds <= t.max) ??
    TIME_SAVE_TIERS[TIME_SAVE_TIERS.length - 1]
  );
}

/** ⌚ repeated per tier, e.g. "⌚⌚⌚". */
export function timeSaveIcons(seconds) {
  const tier = timeSaveTier(seconds);
  return tier ? '⌚'.repeat(tier.watches) : '';
}

/** Seconds to a readable value, e.g. 24 -> "24s", 125 -> "2m 05s". */
export function formatSeconds(seconds) {
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return `${seconds}s`;

  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Star rating for a numeric difficulty (e.g. "3" -> "⭐⭐⭐"). Uses the
 * colour star emoji rather than a plain "★" glyph so it stays yellow
 * wherever it's shown, independent of surrounding text colour (same trick
 * as the ⌚ time-save icons). Filled stars only, capped at `max`, with no
 * trailing hollow stars.
 * Returns null when difficulty isn't a usable number, so callers can fall
 * back to showing the raw value instead.
 */
export function difficultyStars(difficulty, max = 5) {
  const n = Number(difficulty);
  if (!Number.isFinite(n) || n <= 0) return null;

  return '⭐'.repeat(Math.min(Math.round(n), max));
}

/**
 * Whether a WordPress `modified` timestamp falls within the last `days`
 * days, for a "New" badge on catalogue cards. Evaluated at build time, so
 * the badge is only as fresh as the last build/deploy, not the visitor's
 * clock — fine for a site that rebuilds on every content change, but it
 * won't clear itself if the site then goes a while without a rebuild.
 */
export function isRecent(modified, days = 7) {
  const modifiedAt = new Date(modified).getTime();
  if (Number.isNaN(modifiedAt)) return false;
  return Date.now() - modifiedAt < days * 24 * 60 * 60 * 1000;
}

/** Pull a YouTube video id out of any of the usual URL shapes. */
export function youtubeId(url) {
  const m = String(url || '').match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Seconds into the clip a YouTube link points to, from its `t=`/`start=`
 * param (accepts both plain seconds and YouTube's "1h2m3s" share format).
 * Returns null when the link carries no timestamp.
 */
export function youtubeStart(url) {
  const m = String(url || '').match(/[?&](?:t|start)=([0-9hms]+)/i);
  if (!m) return null;

  const value = m[1];
  if (/^\d+$/.test(value)) return Number(value);

  let seconds = 0;
  let found = false;
  for (const part of value.matchAll(/(\d+)([hms])/gi)) {
    found = true;
    const n = Number(part[1]);
    seconds += n * { h: 3600, m: 60, s: 1 }[part[2].toLowerCase()];
  }
  return found ? seconds : null;
}
