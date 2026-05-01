/**
 * StoreKit 2 bridge — shared type surface (feature 050).
 *
 * Pure module: no React, no native imports. Used by the four
 * `src/native/storekit*.ts` siblings, the `useStoreKit` hook,
 * and the storekit-lab components.
 */

export const NATIVE_MODULE_NAME = 'StoreKitBridge' as const;

/** StoreKit 2 product types. */
export type ProductType = 'consumable' | 'nonConsumable' | 'autoRenewable' | 'nonRenewing';

export const PRODUCT_TYPES: readonly ProductType[] = Object.freeze([
  'consumable',
  'nonConsumable',
  'autoRenewable',
  'nonRenewing',
]);

/** Subscription period unit (auto-renewable products only). */
export type SubscriptionPeriodUnit = 'day' | 'week' | 'month' | 'year';

export interface SubscriptionPeriod {
  readonly unit: SubscriptionPeriodUnit;
  readonly value: number;
}

/** A product fetched from the App Store / configuration file. */
export interface StoreKitProduct {
  readonly id: string;
  readonly type: ProductType;
  readonly displayName: string;
  readonly description: string;
  /** Localized price string (e.g. "$0.99"). */
  readonly displayPrice: string;
  /** Decimal-string price in the product's currency. */
  readonly price: string;
  /** ISO-4217 currency code (e.g. "USD"). */
  readonly currencyCode: string;
  /** Present only for `autoRenewable` products. */
  readonly subscriptionPeriod?: SubscriptionPeriod;
}

/** Outcome of a `Product.purchase()` call. */
export type PurchaseOutcome = 'success' | 'userCancelled' | 'pending';

export const PURCHASE_OUTCOMES: readonly PurchaseOutcome[] = Object.freeze([
  'success',
  'userCancelled',
  'pending',
]);

/** Single transaction record (success only — `Transaction.all`). */
export interface StoreKitTransaction {
  readonly id: string;
  readonly productId: string;
  readonly productType: ProductType;
  /** Milliseconds since the Unix epoch. */
  readonly purchaseDate: number;
  /** Milliseconds since the Unix epoch; null for non-subs. */
  readonly expirationDate: number | null;
  readonly isUpgraded: boolean;
}

/** Active entitlement summary derived from `Transaction.currentEntitlements`. */
export interface EntitlementSummary {
  readonly productId: string;
  readonly productType: ProductType;
  readonly purchaseDate: number;
  readonly expirationDate: number | null;
}

/** Auto-renewable subscription renewal/status info. */
export type SubscriptionState =
  | 'subscribed'
  | 'expired'
  | 'inBillingRetry'
  | 'inGracePeriod'
  | 'revoked';

export const SUBSCRIPTION_STATES: readonly SubscriptionState[] = Object.freeze([
  'subscribed',
  'expired',
  'inBillingRetry',
  'inGracePeriod',
  'revoked',
]);

export interface SubscriptionStatusInfo {
  readonly productId: string;
  readonly state: SubscriptionState;
  readonly willAutoRenew: boolean;
  readonly expirationDate: number | null;
}

/** Result of `Product.purchase()`. */
export interface PurchaseResult {
  readonly outcome: PurchaseOutcome;
  readonly transaction: StoreKitTransaction | null;
  readonly errorMessage: string | null;
}

export interface StoreKitBridge {
  products(ids: readonly string[]): Promise<readonly StoreKitProduct[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  currentEntitlements(): Promise<readonly EntitlementSummary[]>;
  transactionHistory(): Promise<readonly StoreKitTransaction[]>;
  subscriptionStatuses(): Promise<readonly SubscriptionStatusInfo[]>;
  restore(): Promise<void>;
}

/**
 * Typed error thrown by Android / Web variants and by the iOS
 * variant when the native module is missing.
 */
export class StoreKitNotSupported extends Error {
  public readonly code = 'STOREKIT_NOT_SUPPORTED' as const;

  constructor(message = 'StoreKit 2 is not available on this platform') {
    super(message);
    this.name = 'StoreKitNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StoreKitNotSupported);
    }
  }
}
