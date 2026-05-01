/**
 * Tap to Pay Bridge Types
 * Feature: 051-tap-to-pay
 *
 * Shared type definitions for the Tap to Pay on iPhone bridge.
 * iOS 16.0+ ProximityReader / PaymentCardReaderSession wrapper.
 */

export const NATIVE_MODULE_NAME = 'TapToPay' as const;

export interface LineItem {
  label: string;
  amount: number; // cents/minor units
}

export interface AcceptPaymentOptions {
  amount: number; // cents/minor units
  currency: string; // ISO 4217 code (e.g., 'USD')
  lineItems?: LineItem[];
}

export type PaymentOutcome = 'success' | 'declined' | 'error';

export interface PaymentResult {
  outcome: PaymentOutcome;
  transactionId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  declinedReason?: string;
}

export type DiscoveryStatus = 'idle' | 'discovering' | 'ready' | 'error';

export interface TapToPayBridge {
  isSupported(): Promise<boolean>;
  discover(): Promise<void>;
  acceptPayment(opts: AcceptPaymentOptions): Promise<PaymentResult>;
}

export class TapToPayNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TapToPayNotSupported';
  }
}
