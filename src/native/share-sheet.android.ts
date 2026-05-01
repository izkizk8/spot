/**
 * Share Sheet Bridge - Android variant
 * Feature: 033-share-sheet
 *
 * Android share path:
 *   - File content: delegates to expo-sharing.shareAsync
 *   - Text/URL content: delegates to expo-clipboard (synthetic activityType)
 *
 * Throws ShareSheetNotSupported when iOS-only capabilities are requested.
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts B5, B6, B9
 * @see specs/033-share-sheet/research.md §4 (R-D classification)
 */

import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

import {
  ShareSheetBridge,
  ShareSheetNotSupported,
  ShareOptions,
  ShareResult,
} from './share-sheet.types';

export { ShareSheetNotSupported };

/**
 * Serialisation chain (same pattern as iOS).
 */
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn);
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export const bridge: ShareSheetBridge = Object.freeze({
  isAvailable: (): boolean => true,

  present: (opts: ShareOptions): Promise<ShareResult> => {
    // B9: throw for iOS-only capabilities
    if (
      opts.excludedActivityTypes.length > 0 ||
      opts.includeCustomActivity ||
      opts.anchor != null
    ) {
      return Promise.reject(
        new ShareSheetNotSupported(
          'excludedActivityTypes, includeCustomActivity, and anchor are iOS-only',
        ),
      );
    }

    return enqueue(async () => {
      const { content } = opts;

      // B5: file content → expo-sharing
      if (content.kind === 'file') {
        try {
          await Sharing.shareAsync(content.uri);
          return { activityType: null, completed: true };
        } catch {
          return { activityType: null, completed: false };
        }
      }

      // B6: text/url content → clipboard fallback
      const text =
        content.kind === 'text' ? content.text : content.kind === 'url' ? content.url : '';
      await Clipboard.setStringAsync(text);
      return { activityType: 'android.clipboard-fallback', completed: true };
    });
  },
});
