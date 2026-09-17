import { useEffect, useRef, useState } from 'react';
import { mapProvider } from '@infrastructure/maps/provider';
import type { PlaceSearchResult } from '@infrastructure/maps/types';
import { isAppError, type AppErrorCode } from '@application/errors';

export type PlaceSearchStatus = 'idle' | 'loading' | 'success' | 'error';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

export function usePlaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<PlaceSearchStatus>('idle');
  const [errorCode, setErrorCode] = useState<AppErrorCode | null>(null);
  const latestQueryRef = useRef<string>('');

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus('idle');
      setErrorCode(null);
      return;
    }

    latestQueryRef.current = trimmed;
    setStatus('loading');

    const timer = setTimeout(() => {
      mapProvider
        .search(trimmed)
        .then((found) => {
          if (latestQueryRef.current !== trimmed) {
            return; // a newer query superseded this one
          }
          setResults(found);
          setErrorCode(null);
          setStatus('success');
        })
        .catch((error: unknown) => {
          if (latestQueryRef.current !== trimmed) {
            return;
          }
          setResults([]);
          setErrorCode(isAppError(error) ? error.code : 'MAP_SEARCH_FAILED');
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, status, errorCode };
}
