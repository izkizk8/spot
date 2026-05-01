/**
 * useLiveText Hook
 * Feature: 080-live-text
 *
 * State machine for the Live Text lab. The native bridge is
 * replaceable at the import boundary via __setLiveTextBridgeForTests
 * for unit tests.
 */

import { useCallback, useState } from 'react';

import liveTextDefault from '@/native/live-text';
import type {
  LiveTextBridge,
  LiveTextCapabilities,
  OCRResult,
  RecognitionLanguage,
  ScannerConfig,
  ScanSession,
} from '@/native/live-text.types';

let mockBridge: LiveTextBridge | null = null;

export function __setLiveTextBridgeForTests(bridge: LiveTextBridge | null) {
  mockBridge = bridge;
}

function getBridge(): LiveTextBridge {
  if (mockBridge) return mockBridge;
  return liveTextDefault;
}

export interface LiveTextState {
  capabilities: LiveTextCapabilities | null;
  lastResult: OCRResult | null;
  activeScanSession: ScanSession | null;
  loading: boolean;
  lastError: Error | null;
}

export interface LiveTextActions {
  refreshCapabilities(): Promise<void>;
  recognizeText(base64Image: string, language?: RecognitionLanguage): Promise<OCRResult | null>;
  startScanner(config: ScannerConfig): Promise<ScanSession | null>;
  stopScanner(sessionId: string): Promise<void>;
}

export function useLiveText(): LiveTextState & LiveTextActions {
  const [capabilities, setCapabilities] = useState<LiveTextCapabilities | null>(null);
  const [lastResult, setLastResult] = useState<OCRResult | null>(null);
  const [activeScanSession, setActiveScanSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const refreshCapabilities = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const caps = await getBridge().getCapabilities();
      setCapabilities(caps);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const recognizeText = useCallback(
    async (base64Image: string, language?: RecognitionLanguage): Promise<OCRResult | null> => {
      setLoading(true);
      setLastError(null);
      try {
        const result = await getBridge().recognizeText(base64Image, language);
        setLastResult(result);
        return result;
      } catch (err) {
        setLastError(err as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const startScanner = useCallback(async (config: ScannerConfig): Promise<ScanSession | null> => {
    setLastError(null);
    try {
      const session = await getBridge().startScanner(config);
      setActiveScanSession(session);
      return session;
    } catch (err) {
      setLastError(err as Error);
      return null;
    }
  }, []);

  const stopScanner = useCallback(async (sessionId: string): Promise<void> => {
    setLastError(null);
    try {
      await getBridge().stopScanner(sessionId);
      setActiveScanSession(null);
    } catch (err) {
      setLastError(err as Error);
    }
  }, []);

  return {
    capabilities,
    lastResult,
    activeScanSession,
    loading,
    lastError,
    refreshCapabilities,
    recognizeText,
    startScanner,
    stopScanner,
  };
}
