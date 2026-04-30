/**
 * Apple Pay Bridge — Android variant (feature 049).
 *
 * `canMakePayments*` returns false; `presentPaymentRequest`
 * rejects with `ApplePayNotSupported`. MUST NOT import the iOS
 * variant.
 */

import {
  ApplePayNotSupported,
  type PaymentRequestOptions,
  type PaymentResult,
  type SupportedNetwork,
} from './applepay.types';

export { ApplePayNotSupported };

const ERR = (): ApplePayNotSupported =>
  new ApplePayNotSupported('Apple Pay is not available on Android');

export function canMakePayments(): boolean {
  return false;
}

export function canMakePaymentsUsingNetworks(_networks: readonly SupportedNetwork[]): boolean {
  return false;
}

export function presentPaymentRequest(_opts: PaymentRequestOptions): Promise<PaymentResult> {
  return Promise.reject(ERR());
}

export const applepay = {
  canMakePayments,
  canMakePaymentsUsingNetworks,
  presentPaymentRequest,
};

export default applepay;
