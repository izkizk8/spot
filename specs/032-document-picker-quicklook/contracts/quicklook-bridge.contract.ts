/**
 * Contract: JS bridge to the iOS Quick Look surface.
 *
 * @feature 032-document-picker-quicklook
 * @see specs/032-document-picker-quicklook/spec.md FR-013, FR-014, FR-019
 * @see specs/032-document-picker-quicklook/data-model.md Entities 5, 6
 * @see specs/032-document-picker-quicklook/research.md §1 (R-A serialisation)
 *
 * Implementation files:
 *   - src/native/quicklook.ts          (iOS path)
 *   - src/native/quicklook.android.ts  (throws everywhere except isAvailable)
 *   - src/native/quicklook.web.ts      (same as android)
 *   - src/native/quicklook.types.ts    (re-exports the types here)
 *
 * INVARIANTS (asserted by `test/unit/native/quicklook.test.ts`):
 *   B1. Native module name is the literal string 'QuickLook'.
 *       Distinct from prior modules:
 *         - 013 'AppIntents'
 *         - 014/027/028 'WidgetCenter'
 *         - 029 'FocusFilters'
 *         - 030 'BackgroundTasks'
 *         - 031 'Spotlight'
 *   B2. On non-iOS / iOS < 11, `present()` throws
 *       `QuickLookNotSupported`. `isAvailable()` returns `false`
 *       synchronously.
 *   B3. `present()` calls are serialised through a single closure-
 *       scoped promise chain inherited verbatim from 030 / 031's
 *       `enqueue` helper. Two back-to-back `present()` calls produce
 *       native invocations in submission order even if the first
 *       rejects (research §1 / R-A).
 *   B4. `isAvailable()` is NOT serialised; it is a pure synchronous
 *       read of `Platform.OS === 'ios' && nativeModule != null`.
 *   B5. `present()` resolves with `{ shown: true }` exactly when
 *       the `QLPreviewController` `viewDidAppear`. On any failure,
 *       it rejects with an `Error` whose message includes one of
 *       the codes documented in `data-model.md` Entity 5
 *       ('invalid-uri' / 'unreadable' / 'no-root-view-controller'
 *        / 'preview-failed').
 */

export const NATIVE_MODULE_NAME = 'QuickLook' as const;

/**
 * Output of `present(uri:)`. Native side resolves this exactly once
 * the preview sheet appears; see invariant B5.
 */
export interface QuickLookPresentResult {
  readonly shown: true;
}

/**
 * Typed error class for cross-platform branching at the import
 * boundary. Consumers MAY `instanceof`-check.
 *
 * Exported from `src/native/quicklook.types.ts` so that all three
 * sibling implementations (ios / android / web) share the same
 * class identity.
 */
export declare class QuickLookNotSupported extends Error {
  readonly name: 'QuickLookNotSupported';
  constructor(message?: string);
}

export interface QuickLookBridge {
  /**
   * Returns `true` on iOS 11+ when the native module is loadable.
   * Returns `false` on Android, Web, and iOS < 11 (synchronously).
   * Pure read; never throws.
   */
  readonly isAvailable: () => boolean;

  /**
   * Presents `QLPreviewController` modally over the current root
   * view controller, sourcing its single preview item from the
   * supplied URI. Resolves with `{ shown: true }` once the sheet
   * appears.
   *
   * @throws QuickLookNotSupported on non-iOS / iOS < 11.
   * @throws Error (with `code` on the message) on iOS when the URI
   *         is invalid, the file is unreadable, no root view
   *         controller is available, or `QLPreviewController`
   *         rejects the item. See data-model.md Entity 5.
   */
  readonly present: (uri: string) => Promise<QuickLookPresentResult>;
}
