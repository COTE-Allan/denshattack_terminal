import { useCallback, useEffect, useState } from 'react';

function readStored(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    // Storage can be unavailable (private browsing, quota, disabled) — the
    // set just won't persist across reloads in that case.
    return new Set();
  }
}

function writeStored(key, set) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // Same as above: fine to silently no-op.
  }
}

/**
 * A Set of skip ids persisted to localStorage under `key` — the shared
 * mechanics behind both "learned" (useLearned.js) and "my route"
 * (useRouteSheet.js): same read/write/toggle behavior, different key and
 * different meaning to whoever's using it.
 */
export function useSkipSet(key) {
  const [items, setItems] = useState(() => new Set());
  // Read from localStorage after mount only, so the server-rendered markup
  // and the first client render match (no hydration mismatch) — same
  // pattern as SearchResults.jsx's ?q= handling.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(readStored(key));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const toggle = useCallback(
    (id) => {
      setItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        writeStored(key, next);
        return next;
      });
    },
    [key]
  );

  const reset = useCallback(() => {
    setItems(new Set());
    writeStored(key, new Set());
  }, [key]);

  return { items, loaded, toggle, reset };
}
