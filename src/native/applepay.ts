/**
 * Apple Pay Bridge — iOS variant (feature 049).
 *
 * Single seam where the `ApplePayBridge` Expo Module is touched.
 * The native module is resolved via `requireOptionalNativeModule`
 * so the surface is null-safe in unit tests where the module is
 * absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  ApplePayNotSupported,
  type PaymentRequestOptions,
  type PaymentResult,
  type SupportedNetwork,
} from './applepay.types';

export { ApplePayNotSupported };

interface NativeApplePay {
  canMakePayments(): boolean;
  canMakePaymentsUsingNetworks(networks: readonly SupportedNetwork[]): boolean;
  presentPaymentRequest(opts: PaymentRequestOptions): Promise<PaymentResult>;
}

function getNative(): NativeApplePay | null {
  return requireOptionalNativeModule<NativeApplePay>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeApplePay {
  if (Platform.OS !== 'ios') {
    throw new ApplePayNotSupported(`Apple Pay is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new ApplePayNotSupported('Apple Pay native module is not registered');
  }
  return native;
}

export function canMakePayments(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.canMakePayments();
}

export function canMakePaymentsUsingNetworks(networks: readonly SupportedNetwork[]): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.canMakePaymentsUsingNetworks(networks);
}

export function presentPaymentRequest(opts: PaymentRequestOptions): Promise<PaymentResult> {
  try {
    return ensureNative().presentPaymentRequest(opts);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const applepay = {
  canMakePayments,
  canMakePaymentsUsingNetworks,
  presentPaymentRequest,
};

export default applepay;
