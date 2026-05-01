/**
 * useApplePay — feature 049 / Apple Pay Lab.
 *
 * Wraps `src/native/applepay.ts` into a React-friendly state
 * machine. Owns:
 *   - the composed payment request;
 *   - capability flags (overall + per-network);
 *   - last result (status / token / error);
 *   - last error message surfaced from the bridge.
 *
 * Contracts:
 *   - `pay()` is no-throw: errors surface via `lastError` and a
 *     'failure' result entry.
 *   - The hook ignores async completions that resolve after
 *     unmount (an internal `aliveRef` guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap
 *     it out using `__setApplePayBridgeForTests`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import defaultBridge from '@/native/applepay';
import type {
  ApplePayBridge,
  PaymentRequestOptions,
  PaymentResult,
  SupportedNetwork,
} from '@/native/applepay.types';

import { DEFAULT_REQUEST, SUPPORTED_NETWORKS, validateRequest } from '../supported-networks';

let bridgeOverride: ApplePayBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by `useApplePay`.
 * Pass `null` to restore the default bridge. Exported only for
 * tests.
 */
export function __setApplePayBridgeForTests(b: ApplePayBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): ApplePayBridge {
  return bridgeOverride ?? (defaultBridge as unknown as ApplePayBridge);
}

export interface UseApplePayReturn {
  readonly canMakePayments: boolean;
  readonly perNetwork: Readonly<Record<SupportedNetwork, boolean>>;
  readonly request: PaymentRequestOptions;
  readonly lastResult: PaymentResult | null;
  readonly lastError: string | null;
  readonly isPaying: boolean;
  setRequest(next: PaymentRequestOptions): void;
  pay(): Promise<PaymentResult | null>;
  reset(): void;
}

const FALSE_PER_NETWORK: Readonly<Record<SupportedNetwork, boolean>> = Object.freeze({
  Visa: false,
  MasterCard: false,
  AmEx: false,
  Discover: false,
  ChinaUnionPay: false,
});

function probePerNetwork(bridge: ApplePayBridge): Readonly<Record<SupportedNetwork, boolean>> {
  const out: Record<SupportedNetwork, boolean> = { ...FALSE_PER_NETWORK };
  for (const n of SUPPORTED_NETWORKS) {
    try {
      out[n] = bridge.canMakePaymentsUsingNetworks([n]);
    } catch {
      out[n] = false;
    }
  }
  return Object.freeze(out);
}

export function useApplePay(): UseApplePayReturn {
  const [canMakePayments] = useState<boolean>(() => {
    try {
      return getBridge().canMakePayments();
    } catch {
      return false;
    }
  });
  const [perNetwork] = useState<Readonly<Record<SupportedNetwork, boolean>>>(() =>
    probePerNetwork(getBridge()),
  );
  const [request, setRequestState] = useState<PaymentRequestOptions>(DEFAULT_REQUEST);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const setRequest = useCallback((next: PaymentRequestOptions) => {
    setRequestState(next);
  }, []);

  const pay = useCallback(async (): Promise<PaymentResult | null> => {
    const validation = validateRequest(request);
    if (validation !== null) {
      setLastError(validation);
      const failed: PaymentResult = {
        status: 'failure',
        token: null,
        errorMessage: validation,
      };
      setLastResult(failed);
      return failed;
    }
    setIsPaying(true);
    setLastError(null);
    try {
      const result = await getBridge().presentPaymentRequest(request);
      if (!aliveRef.current) return result;
      setLastResult(result);
      if (result.status === 'failure') {
        setLastError(result.errorMessage ?? 'Payment failed.');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!aliveRef.current) return null;
      const failed: PaymentResult = {
        status: 'failure',
        token: null,
        errorMessage: message,
      };
      setLastResult(failed);
      setLastError(message);
      return failed;
    } finally {
      if (aliveRef.current) {
        setIsPaying(false);
      }
    }
  }, [request]);

  const reset = useCallback(() => {
    setLastResult(null);
    setLastError(null);
  }, []);

  return useMemo(
    () => ({
      canMakePayments,
      perNetwork,
      request,
      lastResult,
      lastError,
      isPaying,
      setRequest,
      pay,
      reset,
    }),
    [canMakePayments, perNetwork, request, lastResult, lastError, isPaying, setRequest, pay, reset],
  );
}
