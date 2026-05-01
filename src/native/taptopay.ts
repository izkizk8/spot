/**
 * Tap to Pay Bridge — iOS variant (feature 051).
 *
 * Single seam where the `TapToPay` Expo Module is touched.
 * The native module is resolved via `requireOptionalNativeModule`
 * so the surface is null-safe in unit tests where the module is
 * absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  TapToPayNotSupported,
  type AcceptPaymentOptions,
  type PaymentResult,
  type TapToPayBridge,
} from './taptopay.types';

export { TapToPayNotSupported };

interface NativeTapToPay {
  isSupported(): Promise<boolean>;
  discover(): Promise<void>;
  acceptPayment(opts: AcceptPaymentOptions): Promise<PaymentResult>;
}

function getNative(): NativeTapToPay | null {
  return requireOptionalNativeModule<NativeTapToPay>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeTapToPay {
  if (Platform.OS !== 'ios') {
    throw new TapToPayNotSupported(`Tap to Pay is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new TapToPayNotSupported('TapToPay native module is not registered');
  }
  return native;
}

export function isSupported(): Promise<boolean> {
  try {
    return ensureNative().isSupported();
  } catch {
    return Promise.resolve(false);
  }
}

export function discover(): Promise<void> {
  try {
    return ensureNative().discover();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function acceptPayment(opts: AcceptPaymentOptions): Promise<PaymentResult> {
  try {
    return ensureNative().acceptPayment(opts);
  } catch (err) {
    return Promise.reject(err);
  }
}

export const taptopay: TapToPayBridge = {
  isSupported,
  discover,
  acceptPayment,
};

export default taptopay;
