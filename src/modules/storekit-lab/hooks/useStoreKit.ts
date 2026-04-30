/**
 * useStoreKit — feature 050 / StoreKit Lab.
 *
 * Wraps `src/native/storekit.ts` into a React-friendly state
 * machine. Owns:
 *   - the catalog (products fetched from the bridge);
 *   - active entitlements;
 *   - transaction history;
 *   - subscription statuses;
 *   - last purchase outcome and any surfaced error.
 *
 * Contracts:
 *   - All async helpers are no-throw: errors surface via
 *     `lastError` and (where applicable) a status field.
 *   - The hook ignores async completions that resolve after
 *     unmount (an internal `aliveRef` guards every state update).
 *   - The native bridge is loaded via a getter so tests can swap
 *     it out using `__setStoreKitBridgeForTests`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import defaultBridge from '@/native/storekit';
import type {
  EntitlementSummary,
  PurchaseResult,
  StoreKitBridge,
  StoreKitProduct,
  StoreKitTransaction,
  SubscriptionStatusInfo,
} from '@/native/storekit.types';

import { DEMO_PRODUCT_IDS } from '../demo-products';

let bridgeOverride: StoreKitBridge | null = null;

/**
 * Test helper — replaces the bridge resolved by `useStoreKit`.
 * Pass `null` to restore the default bridge.
 */
export function __setStoreKitBridgeForTests(b: StoreKitBridge | null): void {
  bridgeOverride = b;
}

function getBridge(): StoreKitBridge {
  return bridgeOverride ?? (defaultBridge as unknown as StoreKitBridge);
}

export interface UseStoreKitReturn {
  readonly productIds: readonly string[];
  readonly products: readonly StoreKitProduct[];
  readonly entitlements: readonly EntitlementSummary[];
  readonly history: readonly StoreKitTransaction[];
  readonly subscriptionStatuses: readonly SubscriptionStatusInfo[];
  readonly lastPurchase: PurchaseResult | null;
  readonly lastError: string | null;
  readonly isLoading: boolean;
  readonly isPurchasing: boolean;
  readonly isRestoring: boolean;
  loadProducts(): Promise<readonly StoreKitProduct[]>;
  purchase(productId: string): Promise<PurchaseResult | null>;
  refreshEntitlements(): Promise<readonly EntitlementSummary[]>;
  refreshHistory(): Promise<readonly StoreKitTransaction[]>;
  refreshSubscriptionStatuses(): Promise<readonly SubscriptionStatusInfo[]>;
  restore(): Promise<void>;
  reset(): void;
}

export interface UseStoreKitOptions {
  readonly productIds?: readonly string[];
}

export function useStoreKit(options: UseStoreKitOptions = {}): UseStoreKitReturn {
  const productIds = useMemo<readonly string[]>(
    () => options.productIds ?? DEMO_PRODUCT_IDS,
    [options.productIds],
  );

  const [products, setProducts] = useState<readonly StoreKitProduct[]>([]);
  const [entitlements, setEntitlements] = useState<readonly EntitlementSummary[]>([]);
  const [history, setHistory] = useState<readonly StoreKitTransaction[]>([]);
  const [subscriptionStatuses, setSubscriptionStatuses] = useState<
    readonly SubscriptionStatusInfo[]
  >([]);
  const [lastPurchase, setLastPurchase] = useState<PurchaseResult | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const formatErr = useCallback((err: unknown): string => {
    return err instanceof Error ? err.message : String(err);
  }, []);

  const loadProducts = useCallback(async (): Promise<readonly StoreKitProduct[]> => {
    setIsLoading(true);
    setLastError(null);
    try {
      const result = await getBridge().products(productIds);
      if (!aliveRef.current) return result;
      setProducts(result);
      return result;
    } catch (err) {
      const message = formatErr(err);
      if (aliveRef.current) {
        setLastError(message);
        setProducts([]);
      }
      return [];
    } finally {
      if (aliveRef.current) {
        setIsLoading(false);
      }
    }
  }, [productIds, formatErr]);

  const refreshEntitlements = useCallback(async (): Promise<readonly EntitlementSummary[]> => {
    try {
      const result = await getBridge().currentEntitlements();
      if (!aliveRef.current) return result;
      setEntitlements(result);
      return result;
    } catch (err) {
      if (aliveRef.current) {
        setLastError(formatErr(err));
        setEntitlements([]);
      }
      return [];
    }
  }, [formatErr]);

  const refreshHistory = useCallback(async (): Promise<readonly StoreKitTransaction[]> => {
    try {
      const result = await getBridge().transactionHistory();
      if (!aliveRef.current) return result;
      setHistory(result);
      return result;
    } catch (err) {
      if (aliveRef.current) {
        setLastError(formatErr(err));
        setHistory([]);
      }
      return [];
    }
  }, [formatErr]);

  const refreshSubscriptionStatuses = useCallback(async (): Promise<
    readonly SubscriptionStatusInfo[]
  > => {
    try {
      const result = await getBridge().subscriptionStatuses();
      if (!aliveRef.current) return result;
      setSubscriptionStatuses(result);
      return result;
    } catch (err) {
      if (aliveRef.current) {
        setLastError(formatErr(err));
        setSubscriptionStatuses([]);
      }
      return [];
    }
  }, [formatErr]);

  const purchase = useCallback(
    async (productId: string): Promise<PurchaseResult | null> => {
      if (!productId || productId.trim().length === 0) {
        const failed: PurchaseResult = {
          outcome: 'userCancelled',
          transaction: null,
          errorMessage: 'Product id is required.',
        };
        setLastPurchase(failed);
        setLastError(failed.errorMessage);
        return failed;
      }
      setIsPurchasing(true);
      setLastError(null);
      try {
        const result = await getBridge().purchase(productId);
        if (!aliveRef.current) return result;
        setLastPurchase(result);
        if (result.outcome === 'success') {
          await refreshEntitlements();
          await refreshHistory();
        }
        if (result.errorMessage) {
          setLastError(result.errorMessage);
        }
        return result;
      } catch (err) {
        const message = formatErr(err);
        if (!aliveRef.current) return null;
        const failed: PurchaseResult = {
          outcome: 'userCancelled',
          transaction: null,
          errorMessage: message,
        };
        setLastPurchase(failed);
        setLastError(message);
        return failed;
      } finally {
        if (aliveRef.current) {
          setIsPurchasing(false);
        }
      }
    },
    [formatErr, refreshEntitlements, refreshHistory],
  );

  const restore = useCallback(async (): Promise<void> => {
    setIsRestoring(true);
    setLastError(null);
    try {
      await getBridge().restore();
      if (aliveRef.current) {
        await refreshEntitlements();
        await refreshHistory();
      }
    } catch (err) {
      if (aliveRef.current) {
        setLastError(formatErr(err));
      }
    } finally {
      if (aliveRef.current) {
        setIsRestoring(false);
      }
    }
  }, [formatErr, refreshEntitlements, refreshHistory]);

  const reset = useCallback(() => {
    setLastPurchase(null);
    setLastError(null);
  }, []);

  return useMemo(
    () => ({
      productIds,
      products,
      entitlements,
      history,
      subscriptionStatuses,
      lastPurchase,
      lastError,
      isLoading,
      isPurchasing,
      isRestoring,
      loadProducts,
      purchase,
      refreshEntitlements,
      refreshHistory,
      refreshSubscriptionStatuses,
      restore,
      reset,
    }),
    [
      productIds,
      products,
      entitlements,
      history,
      subscriptionStatuses,
      lastPurchase,
      lastError,
      isLoading,
      isPurchasing,
      isRestoring,
      loadProducts,
      purchase,
      refreshEntitlements,
      refreshHistory,
      refreshSubscriptionStatuses,
      restore,
      reset,
    ],
  );
}
