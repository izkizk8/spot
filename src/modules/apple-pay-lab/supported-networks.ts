/**
 * supported-networks — Apple Pay Lab (feature 049).
 *
 * Pure module: no React, no native imports. Re-exports the
 * frozen `SUPPORTED_NETWORKS` catalog from the bridge types and
 * adds defensive helpers used by the composer + hook.
 */

import {
  AUTHORIZATION_STATUSES,
  SUPPORTED_NETWORKS,
  ZERO_CONTACT_FIELDS,
  type ContactFieldRequirements,
  type PaymentRequestOptions,
  type SummaryItem,
  type SupportedNetwork,
} from '@/native/applepay.types';

export {
  AUTHORIZATION_STATUSES,
  SUPPORTED_NETWORKS,
  ZERO_CONTACT_FIELDS,
  type ContactFieldRequirements,
  type SupportedNetwork,
};

export interface NetworkDescriptor {
  readonly id: SupportedNetwork;
  readonly displayName: string;
  /** Short marketing initials shown on the capability card. */
  readonly initials: string;
}

export const NETWORK_CATALOG: readonly NetworkDescriptor[] = Object.freeze([
  Object.freeze({ id: 'Visa' as const, displayName: 'Visa', initials: 'V' }),
  Object.freeze({ id: 'MasterCard' as const, displayName: 'Mastercard', initials: 'MC' }),
  Object.freeze({ id: 'AmEx' as const, displayName: 'American Express', initials: 'AmEx' }),
  Object.freeze({ id: 'Discover' as const, displayName: 'Discover', initials: 'D' }),
  Object.freeze({
    id: 'ChinaUnionPay' as const,
    displayName: 'China UnionPay',
    initials: 'CUP',
  }),
]);

/** True for an ASCII decimal-string with at most two fraction digits. */
export function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(amount);
}

/**
 * Sum all summary-item amounts. Returns a string with two
 * fraction digits. Items with invalid amounts are treated as
 * zero (the composer's input filter normally prevents this).
 */
export function totalAmount(items: readonly SummaryItem[]): string {
  let total = 0;
  for (const it of items) {
    if (isValidAmount(it.amount)) {
      total += Number(it.amount);
    }
  }
  return total.toFixed(2);
}

/**
 * Validate a payment request shape. Returns null when valid,
 * otherwise a single human-readable message describing the
 * first failure.
 */
export function validateRequest(opts: PaymentRequestOptions): string | null {
  if (!opts.merchantIdentifier || opts.merchantIdentifier.trim().length === 0) {
    return 'Merchant identifier is required.';
  }
  if (!opts.merchantIdentifier.startsWith('merchant.')) {
    return 'Merchant identifier must start with "merchant.".';
  }
  if (!/^[A-Z]{2}$/.test(opts.countryCode)) {
    return 'Country code must be a two-letter ISO code (e.g. "US").';
  }
  if (!/^[A-Z]{3}$/.test(opts.currencyCode)) {
    return 'Currency code must be a three-letter ISO code (e.g. "USD").';
  }
  if (opts.supportedNetworks.length === 0) {
    return 'Select at least one supported network.';
  }
  if (opts.summaryItems.length === 0) {
    return 'Add at least one summary item.';
  }
  for (const it of opts.summaryItems) {
    if (it.label.trim().length === 0) {
      return 'Every summary item must have a label.';
    }
    if (!isValidAmount(it.amount)) {
      return 'Every summary-item amount must be a decimal string (e.g. "12.50").';
    }
  }
  return null;
}

/**
 * Default starting request used by the composer. All fields
 * point at the placeholder merchant id seeded by the plugin.
 */
export const DEFAULT_REQUEST: PaymentRequestOptions = Object.freeze({
  merchantIdentifier: 'merchant.com.izkizk8.spot',
  countryCode: 'US',
  currencyCode: 'USD',
  supportedNetworks: SUPPORTED_NETWORKS,
  summaryItems: Object.freeze([
    Object.freeze({ label: 'Coffee', amount: '4.50' }),
    Object.freeze({ label: 'Pastry', amount: '3.25' }),
    Object.freeze({ label: 'Total', amount: '7.75' }),
  ]),
  requiredContactFields: ZERO_CONTACT_FIELDS,
});
