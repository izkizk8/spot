/**
 * Contract: native iOS Expo Module surface for ShareSheet.
 *
 * @feature 033-share-sheet
 * @see specs/033-share-sheet/spec.md FR-013, FR-014, FR-015
 * @see specs/033-share-sheet/data-model.md Entities 1–4
 * @see specs/033-share-sheet/research.md §7 (R-G presenter lifecycle)
 *
 * Implementation files:
 *   - native/ios/share-sheet/ShareSheetPresenter.swift
 *   - native/ios/share-sheet/CopyWithPrefixActivity.swift
 *
 * This file documents the JS-visible Expo Module Function shape that
 * the Swift class MUST expose. There are no JS unit tests for this
 * file — Swift cannot be exercised on Windows. On-device verification
 * is documented in `quickstart.md`.
 *
 * INVARIANTS (verified on-device per quickstart.md):
 *   N1. `Module.Name` is the literal string 'ShareSheet'.
 *   N2. `present` is registered as `AsyncFunction` (returns a Promise
 *       to JS).
 *   N3. `isAvailable` is registered as `Function` (synchronous return)
 *       and returns `true` on iOS 8+.
 *   N4. `present(opts)` resolves exactly once, from the
 *       `UIActivityViewController.completionWithItemsHandler` callback,
 *       with `{ activityType: activityType?.rawValue ?? null,
 *       completed: completed }`.
 *   N5. `present(opts)` rejects with a typed error when:
 *         - the current root view controller cannot be found
 *           ('no-root-view-controller');
 *         - `opts.anchor` is null on iPad ('missing-ipad-anchor');
 *         - the activity items array is empty ('empty-activity-items');
 *         - any other UIKit-level rejection ('present-failed').
 *   N6. The presenter holds itself alive for the duration of the
 *       sheet (strong-ref via associated object on the controller)
 *       and releases on dismissal. No leaks across rapid open/close
 *       cycles.
 *   N7. `CopyWithPrefixActivity` is appended to the
 *       `applicationActivities` array iff `opts.includeCustomActivity`
 *       is `true`.
 *   N8. `excludedActivityTypes` is mapped from the JS string array to
 *       `[UIActivity.ActivityType]` via raw-value initialisation.
 *       Unknown strings are forwarded verbatim (UIKit ignores them).
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- contract types are
   documentation surfaces, not runtime exports.
   NOTE: This eslint-disable comment is illustrative; in implementation
   we mark these as `export type` so they ARE exports and no disable is
   needed. */

/** Wire-format payload shape decoded by the Swift side. */
export type SharePayloadJson =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'image'; readonly source: number; readonly alt: string }
  | {
      readonly kind: 'file';
      readonly uri: string;
      readonly name: string;
      readonly mimeType: string;
      readonly size: number;
    };

export type ShareOptionsJson = {
  readonly content: SharePayloadJson;
  readonly excludedActivityTypes: readonly string[];
  readonly includeCustomActivity: boolean;
  readonly anchor:
    | { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
    | null;
};

export type ShareResultJson = {
  readonly activityType: string | null;
  readonly completed: boolean;
};

/**
 * Pseudo-signature of the Swift Expo Module:
 *
 *   Module("ShareSheet") {
 *     AsyncFunction("present") { (opts: ShareOptionsJson, promise: Promise) -> Void }
 *     Function("isAvailable") { () -> Bool }
 *   }
 *
 * Error codes surfaced via `promise.reject(code, message)`:
 *   - 'no-root-view-controller'
 *   - 'missing-ipad-anchor'
 *   - 'empty-activity-items'
 *   - 'present-failed'
 */
export type ShareSheetNativeModule = {
  readonly present: (opts: ShareOptionsJson) => Promise<ShareResultJson>;
  readonly isAvailable: () => boolean;
};
