/**
 * Share Sheet Bridge - iOS variant
 * Feature: 033-share-sheet
 *
 * Single seam where the iOS-only `ShareSheet` native module is touched.
 * Resolves to a rejecting bridge when the optional native module is
 * absent or on non-iOS platforms.
 *
 * Mutating method calls are serialised through a single closure-scoped
 * promise chain so back-to-back calls produce native invocations in
 * submission order even when an earlier call rejects (R-A / B3).
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts
 * @see specs/033-share-sheet/research.md §1 (R-A serialisation)
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  ShareSheetBridge,
  ShareSheetNotSupported,
  ShareOptions,
  ShareResult,
} from './share-sheet.types';

export { ShareSheetNotSupported };

interface NativeShareSheet {
  present(opts: ShareOptions): Promise<ShareResult>;
}

const native = requireOptionalNativeModule<NativeShareSheet>(NATIVE_MODULE_NAME);

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
    () => undefined,
  );
  return result;
}

export const bridge: ShareSheetBridge = Object.freeze({
  isAvailable: (): boolean => isReady(),

  present: (opts: ShareOptions): Promise<ShareResult> => {
    if (!isReady()) {
      return Promise.reject(
        new ShareSheetNotSupported('Share Sheet is only available on iOS with the native module'),
      );
    }

    return enqueue(() => native.present(opts));
  },
});
