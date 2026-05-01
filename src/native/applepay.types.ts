/**
 * Apple Pay (PassKit Payment) bridge — shared type surface (feature 049).
 *
 * Pure module: no React, no native imports. Used by all four
 * `src/native/applepay*.ts` siblings, the `useApplePay` hook,
 * and the apple-pay-lab components.
 */

export const NATIVE_MODULE_NAME = 'ApplePayBridge' as const;

/**
 * The catalog of payment networks demonstrated by this lab.
 * The strings match Apple's `PKPaymentNetwork` raw values where
 * relevant ('Visa', 'MasterCard', 'AmEx', 'Discover',
 * 'ChinaUnionPay').
 */
export type SupportedNetwork = 'Visa' | 'MasterCard' | 'AmEx' | 'Discover' | 'ChinaUnionPay';

export const SUPPORTED_NETWORKS: readonly SupportedNetwork[] = Object.freeze([
  'Visa',
  'MasterCard',
  'AmEx',
  'Discover',
  'ChinaUnionPay',
]);

/** ISO 4217 currency code (e.g. 'USD', 'EUR'). */
export type CurrencyCode = string;

/** ISO 3166-1 alpha-2 country code (e.g. 'US', 'GB'). */
export type CountryCode = string;

/** Single line-item shown in the Apple Pay sheet. */
export interface SummaryItem {
  readonly label: string;
  /** Decimal-string amount in the request's currency (e.g. '12.50'). */
  readonly amount: string;
}

/** Contact-field requirements toggled by the composer. */
export interface ContactFieldRequirements {
  readonly billing: boolean;
  readonly shipping: boolean;
  readonly email: boolean;
  readonly phone: boolean;
}

export const ZERO_CONTACT_FIELDS: ContactFieldRequirements = Object.freeze({
  billing: false,
  shipping: false,
  email: false,
  phone: false,
});

/** Optional shipping method shown in the Apple Pay sheet. */
export interface ShippingMethod {
  readonly identifier: string;
  readonly label: string;
  readonly amount: string;
  readonly detail?: string;
}

/** Full payment-request descriptor passed to the bridge. */
export interface PaymentRequestOptions {
  readonly merchantIdentifier: string;
  readonly countryCode: CountryCode;
  readonly currencyCode: CurrencyCode;
  readonly supportedNetworks: readonly SupportedNetwork[];
  readonly summaryItems: readonly SummaryItem[];
  readonly requiredContactFields: ContactFieldRequirements;
  readonly shippingMethods?: readonly ShippingMethod[];
}

/** Authorization status returned by the system sheet. */
export type PaymentAuthorizationStatus = 'success' | 'failure' | 'cancelled';

export const AUTHORIZATION_STATUSES: readonly PaymentAuthorizationStatus[] = Object.freeze([
  'success',
  'failure',
  'cancelled',
]);

/** Mock payment token shape (educational — real tokens are processor-specific). */
export interface PaymentToken {
  readonly transactionIdentifier: string;
  readonly paymentNetwork: SupportedNetwork | string;
  readonly paymentDataBase64: string;
}

export interface PaymentResult {
  readonly status: PaymentAuthorizationStatus;
  readonly token: PaymentToken | null;
  readonly errorMessage: string | null;
}

export interface ApplePayBridge {
  canMakePayments(): boolean;
  canMakePaymentsUsingNetworks(networks: readonly SupportedNetwork[]): boolean;
  presentPaymentRequest(opts: PaymentRequestOptions): Promise<PaymentResult>;
}

/**
 * Typed error thrown by Android / Web variants and by the iOS
 * variant when the native module is missing.
 */
export class ApplePayNotSupported extends Error {
  public readonly code = 'APPLE_PAY_NOT_SUPPORTED' as const;

  constructor(message = 'Apple Pay is not available on this platform') {
    super(message);
    this.name = 'ApplePayNotSupported';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplePayNotSupported);
    }
  }
}
