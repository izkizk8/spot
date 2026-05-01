/**
 * demo-products — StoreKit Lab (feature 050).
 *
 * Pure module: no React, no native imports. Ships a placeholder
 * catalog covering all four StoreKit 2 product types plus a
 * handful of helpers used by the UI and hook. Real products
 * require an App Store Connect catalog or a
 * Configuration.storekit file in the Xcode scheme.
 */

import { PRODUCT_TYPES, type ProductType, type StoreKitProduct } from '@/native/storekit.types';

export { PRODUCT_TYPES, type ProductType };

export interface DemoProduct {
  readonly id: string;
  readonly type: ProductType;
  readonly displayName: string;
  readonly description: string;
}

export const DEMO_PRODUCTS: readonly DemoProduct[] = Object.freeze([
  Object.freeze({
    id: 'com.izkizk8.spot.coins.100',
    type: 'consumable' as const,
    displayName: '100 Coins',
    description: 'Replenishable in-game currency. Consumable.',
  }),
  Object.freeze({
    id: 'com.izkizk8.spot.unlock.pro',
    type: 'nonConsumable' as const,
    displayName: 'Unlock Pro',
    description: 'One-time pro feature unlock. Non-consumable.',
  }),
  Object.freeze({
    id: 'com.izkizk8.spot.sub.monthly',
    type: 'autoRenewable' as const,
    displayName: 'Monthly Subscription',
    description: 'Auto-renewing monthly subscription.',
  }),
  Object.freeze({
    id: 'com.izkizk8.spot.sub.season',
    type: 'nonRenewing' as const,
    displayName: 'Season Pass',
    description: 'Fixed-duration access. Non-renewing subscription.',
  }),
]);

export const DEMO_PRODUCT_IDS: readonly string[] = Object.freeze(DEMO_PRODUCTS.map((p) => p.id));

/** True when `id` is non-empty and uses reverse-DNS style. */
export function isProductId(id: string): boolean {
  if (id.length === 0) return false;
  return /^[a-z0-9]+(\.[a-z0-9]+)+$/i.test(id);
}

/** Filter products by their StoreKit 2 type. */
export function byType<T extends { readonly type: ProductType }>(
  products: readonly T[],
  type: ProductType,
): readonly T[] {
  return products.filter((p) => p.type === type);
}

/**
 * Return the `displayPrice` if non-empty, otherwise format the
 * decimal-string `price` with the currency code. Helper used by
 * `ProductRow` so a missing `displayPrice` (sandbox) still
 * renders something sensible.
 */
export function formatPrice(
  p: Pick<StoreKitProduct, 'displayPrice' | 'price' | 'currencyCode'>,
): string {
  if (p.displayPrice && p.displayPrice.trim().length > 0) {
    return p.displayPrice;
  }
  if (p.price && p.currencyCode) {
    return `${p.price} ${p.currencyCode}`;
  }
  return '—';
}

/** True when the type identifies a subscription product. */
export function isSubscriptionType(type: ProductType): boolean {
  return type === 'autoRenewable' || type === 'nonRenewing';
}
