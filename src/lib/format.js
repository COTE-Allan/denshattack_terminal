// shared display helpers for skip cards and detail pages

export const TIME_SAVE_TIERS = [
  { max: 10, watches: 1, short: '1–10s', label: 'Around 1 to 10 seconds of time save.' },
  { max: 30, watches: 2, short: '10–30s', label: 'Around 10 to 30 seconds of time save.' },
  { max: 60, watches: 3, short: '30–60s', label: 'Around 30 to 60 seconds of time save.' },
  { max: 180, watches: 4, short: '1–3m', label: 'Around 1 to 3 minutes of time save.' },
  { max: Infinity, watches: 5, short: '3m+', label: 'More than 3 minutes of time save.' },
];

// maps a time save in seconds to a watch-icon tier, null if not a usable number
export function timeSaveTier(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return (
    TIME_SAVE_TIERS.find((t) => seconds <= t.max) ??
    TIME_SAVE_TIERS[TIME_SAVE_TIERS.length - 1]
  );
}

// how many watch icons a time save is worth (1-5), 0 if not a usable number
export function timeSaveWatchCount(seconds) {
  return timeSaveTier(seconds)?.watches ?? 0;
}

// seconds to a readable estimate, e.g. 24 -> "~24s", 125 -> "~2m 05s", 5400 -> "~1h 30m"
export function formatSeconds(seconds) {
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return `~${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `~${m}m ${String(s).padStart(2, '0')}s`;
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `~${h}h ${String(m).padStart(2, '0')}m`;
}

// how many star icons a difficulty is worth (1-6), 0 if not a usable number
export function difficultyStarCount(difficulty, max = 6) {
  const n = Number(difficulty);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n), max);
}

// whether a modified timestamp is within the last `days` days, evaluated at build time (not the visitor's clock)
export function isRecent(modified, days = 7) {
  const modifiedAt = new Date(modified).getTime();
  if (Number.isNaN(modifiedAt)) return false;
  return Date.now() - modifiedAt < days * 24 * 60 * 60 * 1000;
}

// shared across site-wide search and /new
export const TYPE_LABELS = { skip: 'Skip', technique: 'Technique', sticker: 'Sticker' };

// pulls a youtube video id out of any of the usual url shapes
export function youtubeId(url) {
  const m = String(url || '').match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

// seconds into the clip from a youtube link's t=/start= param, null if none
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
