/**
 * StoreKit 2 Bridge — iOS variant (feature 050).
 *
 * Single seam where the `StoreKitBridge` Expo Module is touched.
 * The native module is resolved via `requireOptionalNativeModule`
 * so the surface is null-safe in unit tests where the module is
 * absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  StoreKitNotSupported,
  type EntitlementSummary,
  type PurchaseResult,
  type StoreKitProduct,
  type StoreKitTransaction,
  type SubscriptionStatusInfo,
} from './storekit.types';

export { StoreKitNotSupported };

interface NativeStoreKit {
  products(ids: readonly string[]): Promise<readonly StoreKitProduct[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  currentEntitlements(): Promise<readonly EntitlementSummary[]>;
  transactionHistory(): Promise<readonly StoreKitTransaction[]>;
  subscriptionStatuses(): Promise<readonly SubscriptionStatusInfo[]>;
  restore(): Promise<void>;
}

function getNative(): NativeStoreKit | null {
  return requireOptionalNativeModule<NativeStoreKit>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeStoreKit {
  if (Platform.OS !== 'ios') {
    throw new StoreKitNotSupported(`StoreKit 2 is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new StoreKitNotSupported('StoreKit native module is not registered');
  }
  return native;
}

export function products(ids: readonly string[]): Promise<readonly StoreKitProduct[]> {
  try {
    return ensureNative().products(ids);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function purchase(productId: string): Promise<PurchaseResult> {
  try {
    return ensureNative().purchase(productId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function currentEntitlements(): Promise<readonly EntitlementSummary[]> {
  try {
    return ensureNative().currentEntitlements();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function transactionHistory(): Promise<readonly StoreKitTransaction[]> {
  try {
    return ensureNative().transactionHistory();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function subscriptionStatuses(): Promise<readonly SubscriptionStatusInfo[]> {
  try {
    return ensureNative().subscriptionStatuses();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function restore(): Promise<void> {
  try {
    return ensureNative().restore();
  } catch (err) {
    return Promise.reject(err);
  }
}

export const storekit = {
  products,
  purchase,
  currentEntitlements,
  transactionHistory,
  subscriptionStatuses,
  restore,
};

export default storekit;
