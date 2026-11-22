import { useCallback, useEffect, useState } from 'react';
export function useApi<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const retry = useCallback(() => setNonce((x) => x + 1), []);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError(undefined);
    loader(c.signal)
      .then(setData)
      .catch((e) => {
        if (e?.name !== 'AbortError') setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [...deps, nonce]);
  return { data, error, loading, retry };
}
