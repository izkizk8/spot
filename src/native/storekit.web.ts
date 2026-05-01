/**
 * StoreKit 2 Bridge — Web variant (feature 050).
 *
 * All methods reject with `StoreKitNotSupported`. MUST NOT
 * import the iOS variant.
 */

import {
  StoreKitNotSupported,
  type EntitlementSummary,
  type PurchaseResult,
  type StoreKitProduct,
  type StoreKitTransaction,
  type SubscriptionStatusInfo,
} from './storekit.types';

export { StoreKitNotSupported };

const ERR = (): StoreKitNotSupported =>
  new StoreKitNotSupported('StoreKit 2 is not available on Web');

export function products(_ids: readonly string[]): Promise<readonly StoreKitProduct[]> {
  return Promise.reject(ERR());
}

export function purchase(_productId: string): Promise<PurchaseResult> {
  return Promise.reject(ERR());
}

export function currentEntitlements(): Promise<readonly EntitlementSummary[]> {
  return Promise.reject(ERR());
}

export function transactionHistory(): Promise<readonly StoreKitTransaction[]> {
  return Promise.reject(ERR());
}

export function subscriptionStatuses(): Promise<readonly SubscriptionStatusInfo[]> {
  return Promise.reject(ERR());
}

export function restore(): Promise<void> {
  return Promise.reject(ERR());
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
