/**
 * Share Sheet Bridge - Web variant
 * Feature: 033-share-sheet
 *
 * Web share path:
 *   - With navigator.share: delegates to Web Share API
 *   - Without navigator.share: delegates to expo-clipboard (synthetic activityType)
 *   - AbortError: treated as cancel (completed: false)
 *
 * Throws ShareSheetNotSupported when iOS-only capabilities are requested.
 *
 * MUST NOT import src/native/share-sheet.ts at module evaluation time.
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts B7, B8, B9
 * @see specs/033-share-sheet/research.md §4 (R-D classification)
 */

import * as Clipboard from 'expo-clipboard';

import {
  ShareSheetBridge,
  ShareSheetNotSupported,
  ShareOptions,
  ShareResult,
} from './share-sheet.types';

export { ShareSheetNotSupported };

/**
 * Serialisation chain (same pattern as iOS/Android).
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

      // B7/B8: try navigator.share, fall back to clipboard
      const hasShareAPI = typeof navigator !== 'undefined' && 'share' in navigator;

      if (hasShareAPI) {
        try {
          let shareData: ShareData = {};

          if (content.kind === 'text') {
            shareData = { text: content.text };
          } else if (content.kind === 'url') {
            shareData = { url: content.url };
          } else if (content.kind === 'image') {
            // Image requires file conversion - fall back to clipboard
            await Clipboard.setStringAsync(content.alt);
            return { activityType: 'web.clipboard-fallback', completed: true };
          } else if (content.kind === 'file') {
            // File sharing via navigator.share is browser-dependent
            // Fall back to clipboard (copy filename)
            await Clipboard.setStringAsync(content.name);
            return { activityType: 'web.clipboard-fallback', completed: true };
          }

          await navigator.share(shareData);
          return { activityType: null, completed: true };
        } catch (err: unknown) {
          // B7: AbortError → cancelled
          if (err instanceof Error && err.name === 'AbortError') {
            return { activityType: null, completed: false };
          }
          // Other errors → fall through to clipboard
        }
      }

      // B8: no navigator.share or error → clipboard fallback
      const text =
        content.kind === 'text'
          ? content.text
          : content.kind === 'url'
            ? content.url
            : content.kind === 'image'
              ? content.alt
              : content.name;

      await Clipboard.setStringAsync(text);
      return { activityType: 'web.clipboard-fallback', completed: true };
    });
  },
});
