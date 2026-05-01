/**
 * useUniversalLinks — feature 041 / Universal Links Lab.
 *
 * Subscribes to `expo-linking` URL events on mount and keeps the most
 * recent {@link UniversalLinkEvent} entries in `log`. Also resolves the
 * initial URL (if the app was launched by tapping a UL) and prepends it
 * to the log.
 *
 * Contracts:
 *   - log is FIFO-truncated to LOG_MAX (10) entries, most-recent first;
 *   - events with non-string or empty URLs are discarded with a dev warn;
 *   - URL parse failures fall back to host='' and path=url;
 *   - subscription is cleanly torn down on unmount;
 *   - events received after unmount are ignored.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';

import type { UniversalLinkEvent } from '../types';

const LOG_MAX = 10;

interface UrlEvent {
  url?: unknown;
}

function normalise(raw: unknown): UniversalLinkEvent | null {
  let urlStr: string | undefined;
  if (typeof raw === 'string') {
    urlStr = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    const candidate = (raw as UrlEvent).url;
    if (typeof candidate === 'string') urlStr = candidate;
  }
  if (urlStr === undefined || urlStr.length === 0) {
    if (__DEV__) {
      console.warn('Discarded malformed Universal Link event:', raw);
    }
    return null;
  }
  let host = '';
  let path = urlStr;
  const match = /^https?:\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(urlStr);
  if (match !== null) {
    host = match[1];
    path = `${match[2] || '/'}${match[3] ?? ''}${match[4] ?? ''}`;
  }
  return {
    url: urlStr,
    host,
    path,
    receivedAt: new Date().toISOString(),
  };
}

export interface UseUniversalLinksReturn {
  readonly log: readonly UniversalLinkEvent[];
  readonly clear: () => void;
  readonly dispatch: (url: string) => Promise<void>;
}

export function useUniversalLinks(): UseUniversalLinksReturn {
  const [log, setLog] = useState<UniversalLinkEvent[]>([]);
  const mountedRef = useRef(true);

  const append = useCallback((raw: unknown) => {
    if (!mountedRef.current) return;
    const event = normalise(raw);
    if (event === null) return;
    setLog((prev) => [event, ...prev].slice(0, LOG_MAX));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const subscription = Linking.addEventListener('url', append);
    let cancelled = false;
    Linking.getInitialURL()
      .then((initial) => {
        if (cancelled || !mountedRef.current) return;
        if (typeof initial === 'string' && initial.length > 0) {
          append(initial);
        }
      })
      .catch(() => {
        // Best-effort: ignore initial URL failures.
      });
    return () => {
      mountedRef.current = false;
      cancelled = true;
      subscription.remove();
    };
  }, [append]);

  const clear = useCallback(() => {
    setLog([]);
  }, []);

  const dispatch = useCallback(async (url: string): Promise<void> => {
    await Linking.openURL(url);
  }, []);

  return { log, clear, dispatch };
}
