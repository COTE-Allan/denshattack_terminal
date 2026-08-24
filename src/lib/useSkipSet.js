import { useCallback, useEffect, useState } from 'react';

function readStored(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set(); // storage can be unavailable (private browsing, quota, disabled)
  }
}

function writeStored(key, set) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // same as above: fine to silently no-op
  }
}

// a set of skip ids persisted to localStorage under `key`, shared by useLearned.js and useRouteSheet.js
export function useSkipSet(key) {
  const [items, setItems] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false); // read from localStorage after mount only, to avoid a hydration mismatch

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

  // union, not replace — route import adds to what's already picked instead of discarding it
  const addMany = useCallback(
    (ids) => {
      setItems((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.add(id);
        writeStored(key, next);
        return next;
      });
    },
    [key]
  );

  return { items, loaded, toggle, reset, addMany };
}
