import { useEffect, useState } from 'react';
import { getAllContent, getSkips, getStickers, getTechniques } from './wp.js';

// shared loading/error wrapper around wp.js's memoized fetchers, used by every catalogue/detail island
function useAsync(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return state;
}

export function useSkips() {
  return useAsync(getSkips);
}

export function useStickers() {
  return useAsync(getStickers);
}

export function useTechniques() {
  return useAsync(getTechniques);
}

export function useAllContent() {
  return useAsync(getAllContent);
}
