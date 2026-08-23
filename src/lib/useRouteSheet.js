import { useSkipSet } from './useSkipSet.js';

const STORAGE_KEY = 'denshattack:route-sheet';

/**
 * Which skips the visitor has picked for their own route (see
 * RouteSheet.jsx). Some skips are mutually exclusive — two alternative
 * ways through the same section that can't both happen in one run — and
 * there's no data anywhere that tells the site which of a pair actually
 * saves more time, so it can't pick for anyone. This just remembers
 * whichever ones a visitor picked for themselves.
 */
export function useRouteSheet() {
  const { items: selected, loaded, toggle, reset, addMany } = useSkipSet(STORAGE_KEY);
  return { selected, loaded, toggle, reset, addMany };
}
