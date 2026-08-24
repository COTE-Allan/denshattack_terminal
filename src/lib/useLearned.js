import { useSkipSet } from './useSkipSet.js';

const STORAGE_KEY = 'denshattack:learned-skips';

// tracks "learned" skips client-side, shared by the catalog's per-card toggle and /practice (same key)
export function useLearnedSkips() {
  const { items: learned, loaded, toggle, reset } = useSkipSet(STORAGE_KEY);
  return { learned, loaded, toggle, reset };
}
