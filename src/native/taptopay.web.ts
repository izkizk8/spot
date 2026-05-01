/**
 * Tap to Pay Bridge — Web stub (feature 051).
 *
 * Tap to Pay is iOS-only. Web stub rejects all operations.
 */

import {
  TapToPayNotSupported,
  type AcceptPaymentOptions,
  type PaymentResult,
  type TapToPayBridge,
} from './taptopay.types';

export { TapToPayNotSupported };

export function isSupported(): Promise<boolean> {
  return Promise.resolve(false);
}

export function discover(): Promise<void> {
  return Promise.reject(new TapToPayNotSupported('Tap to Pay is not supported on web'));
}

export function acceptPayment(_opts: AcceptPaymentOptions): Promise<PaymentResult> {
  return Promise.reject(new TapToPayNotSupported('Tap to Pay is not supported on web'));
}

export const taptopay: TapToPayBridge = {
  isSupported,
  discover,
  acceptPayment,
};

export default taptopay;
