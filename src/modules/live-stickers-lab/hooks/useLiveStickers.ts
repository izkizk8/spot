/**
 * useLiveStickers Hook
 * Feature: 083-live-stickers
 *
 * State machine for the Live Stickers lab. Tracks lifted subjects,
 * loading state, and the last error. The native bridge is replaceable
 * at the import boundary via `__setLiveStickersBridgeForTests` for
 * unit tests.
 */

import { useCallback, useState } from 'react';

import defaultBridge from '@/native/live-stickers';
import type { LiveStickersBridge, LiveStickersResult } from '@/native/live-stickers.types';

let bridgeOverride: LiveStickersBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by `useLiveStickers`.
 * Pass `null` to restore the default bridge. Exported only for tests.
 */
export function __setLiveStickersBridgeForTests(b: LiveStickersBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): LiveStickersBridge {
  return bridgeOverride ?? defaultBridge;
}

export interface UseLiveStickersReturn {
  readonly isSupported: boolean;
  readonly result: LiveStickersResult | null;
  readonly error: string | null;
  readonly isLoading: boolean;
  pickAndLift(): Promise<void>;
  shareSticker(base64Png: string): Promise<void>;
  reset(): void;
}

export function useLiveStickers(): UseLiveStickersReturn {
  const [result, setResult] = useState<LiveStickersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = getBridge().isSupported();

  const pickAndLift = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBridge().pickImageAndLiftSubjects();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const shareSticker = useCallback(async (base64Png: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await getBridge().shareSticker(base64Png);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback((): void => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { isSupported, result, error, isLoading, pickAndLift, shareSticker, reset };
}
