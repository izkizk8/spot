/**
 * QuickLook Bridge - iOS variant
 * Feature: 032-document-picker-quicklook
 *
 * Single seam where the iOS-only `QuickLook` native module is touched.
 * Resolves to a rejecting bridge when the optional native module is
 * absent or on non-iOS platforms.
 *
 * Mutating method calls are serialised through a single closure-scoped
 * promise chain so back-to-back calls produce native invocations in
 * submission order even when an earlier call rejects (R-A / B3).
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  QuickLookBridge,
  QuickLookNotSupported,
  QuickLookPresentResult,
} from './quicklook.types';

export { QuickLookNotSupported };

interface NativeQuickLook {
  present(uri: string): Promise<QuickLookPresentResult>;
}

const native = requireOptionalNativeModule<NativeQuickLook>(NATIVE_MODULE_NAME);

function isReady(): boolean {
  return Platform.OS === 'ios' && native != null;
}

/**
 * Single in-memory promise chain. Every `present()` call queues onto this
 * chain so that even if an earlier call rejects, the next call still
 * executes (R-A / B3). The chain stores `unknown` because each link's
 * value is irrelevant to the next.
 */
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  // Swallow rejections on the chain reference itself so subsequent
  // appends are not poisoned. Callers still observe the rejection
  // through the returned `result` promise.
  chain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export const bridge: QuickLookBridge = Object.freeze({
  isAvailable: (): boolean => isReady(),

  present: (uri: string): Promise<QuickLookPresentResult> => {
    if (!isReady() || native == null) {
      return Promise.reject(
        new QuickLookNotSupported('Quick Look requires iOS 11+ and native module')
      );
    }
    return enqueue(() => native.present(uri));
  },
});
