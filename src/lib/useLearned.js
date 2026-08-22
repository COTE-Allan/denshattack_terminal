import { useSkipSet } from './useSkipSet.js';

const STORAGE_KEY = 'denshattack:learned-skips';

/**
 * Tracks which skips the visitor has marked "learned", purely client-side
 * (localStorage, no account/backend) so it's private to this browser.
 * Shared by the catalog's per-card toggle and /practice, both reading and
 * writing the same key so marking a skip learned in either place shows up
 * in the other.
 */
export function useLearnedSkips() {
  const { items: learned, loaded, toggle, reset } = useSkipSet(STORAGE_KEY);
  return { learned, loaded, toggle, reset };
}
