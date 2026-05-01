/**
 * useTapToPay Hook
 * Feature: 051-tap-to-pay
 *
 * State machine for Tap to Pay flow: capability detection,
 * discovery, payment acceptance. Mocked at import boundary for tests.
 */

import { useState, useCallback } from 'react';

import taptopayDefault from '@/native/taptopay';
import type {
  AcceptPaymentOptions,
  DiscoveryStatus,
  PaymentResult,
  TapToPayBridge,
} from '@/native/taptopay.types';

let mockBridge: TapToPayBridge | null = null;

export function __setTapToPayBridgeForTests(bridge: TapToPayBridge | null) {
  mockBridge = bridge;
}

function getBridge(): TapToPayBridge {
  if (mockBridge) return mockBridge;
  return taptopayDefault;
}

interface TapToPayState {
  supported: boolean | null;
  entitled: boolean | null;
  discovery: DiscoveryStatus;
  lastResult: PaymentResult | null;
  lastError: Error | null;
}

interface TapToPayActions {
  checkSupport: () => Promise<void>;
  discover: () => Promise<void>;
  acceptPayment: (opts: AcceptPaymentOptions) => Promise<void>;
}

export function useTapToPay(): TapToPayState & TapToPayActions {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryStatus>('idle');
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  const checkSupport = useCallback(async () => {
    try {
      const bridge = getBridge();
      const isSupported = await bridge.isSupported();
      setSupported(isSupported);
    } catch {
      setSupported(false);
    }
  }, []);

  const discover = useCallback(async () => {
    setDiscovery('discovering');
    setLastError(null);
    try {
      const bridge = getBridge();
      await bridge.discover();
      setDiscovery('ready');
    } catch (err) {
      setDiscovery('error');
      setLastError(err as Error);
    }
  }, []);

  const acceptPayment = useCallback(async (opts: AcceptPaymentOptions) => {
    setLastError(null);
    setLastResult(null);
    try {
      const bridge = getBridge();
      const result = await bridge.acceptPayment(opts);
      setLastResult(result);
    } catch (err) {
      const error = err as Error;
      setLastError(error);
      // Infer entitlement from error
      if (error.message.includes('not-entitled') || error.message.includes('notEntitled')) {
        setEntitled(false);
      }
    }
  }, []);

  return {
    supported,
    entitled,
    discovery,
    lastResult,
    lastError,
    checkSupport,
    discover,
    acceptPayment,
  };
}
