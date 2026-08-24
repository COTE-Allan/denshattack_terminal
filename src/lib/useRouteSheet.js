import { useSkipSet } from './useSkipSet.js';

const STORAGE_KEY = 'denshattack:route-sheet';

// which skips the visitor has picked for their own route, see routesheet.jsx
export function useRouteSheet() {
  const { items: selected, loaded, toggle, reset, addMany } = useSkipSet(STORAGE_KEY);
  return { selected, loaded, toggle, reset, addMany };
}
