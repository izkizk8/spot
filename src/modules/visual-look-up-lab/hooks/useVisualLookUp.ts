/**
 * Visual Look Up Hook
 * Feature: 060-visual-look-up
 *
 * State machine for the Visual Look Up lab. Tracks support status,
 * the last analysis result, loading state, and the last error.
 * The native bridge is replaceable at the import boundary via
 * `__setVisualLookUpBridgeForTests` for unit tests.
 */

import { useCallback, useState } from 'react';

import visualLookUpDefault from '@/native/visual-look-up';
import type { AnalysisResult, VisualLookUpBridge } from '@/native/visual-look-up.types';

let mockBridge: VisualLookUpBridge | null = null;

export function __setVisualLookUpBridgeForTests(bridge: VisualLookUpBridge | null) {
  mockBridge = bridge;
}

function getBridge(): VisualLookUpBridge {
  if (mockBridge) return mockBridge;
  return visualLookUpDefault;
}

export interface VisualLookUpState {
  supported: boolean | null;
  result: AnalysisResult | null;
  loading: boolean;
  lastError: Error | null;
}

export interface VisualLookUpActions {
  checkSupport: () => Promise<void>;
  analyzeImage: (imageUri: string) => Promise<void>;
  clearResult: () => void;
}

export function useVisualLookUp(): VisualLookUpState & VisualLookUpActions {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const checkSupport = useCallback(async () => {
    setLastError(null);
    try {
      const bridge = getBridge();
      const ok = await bridge.isSupported();
      setSupported(ok);
    } catch (err) {
      setLastError(err as Error);
      setSupported(false);
    }
  }, []);

  const analyzeImage = useCallback(async (imageUri: string) => {
    setLoading(true);
    setLastError(null);
    try {
      const bridge = getBridge();
      const analysisResult = await bridge.analyzeImage(imageUri);
      setResult(analysisResult);
      setSupported(analysisResult.supported);
    } catch (err) {
      setLastError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setLastError(null);
  }, []);

  return {
    supported,
    result,
    loading,
    lastError,
    checkSupport,
    analyzeImage,
    clearResult,
  };
}
