/**
 * Contract: JS bridge to the iOS Share Sheet surface.
 *
 * @feature 033-share-sheet
 * @see specs/033-share-sheet/spec.md FR-011, FR-013, FR-016, FR-017, FR-019
 * @see specs/033-share-sheet/data-model.md Entities 1–4
 * @see specs/033-share-sheet/research.md §1 (R-A serialisation), §4 (R-D classification)
 *
 * Implementation files:
 *   - src/native/share-sheet.ts          (iOS path)
 *   - src/native/share-sheet.android.ts  (file -> expo-sharing; text/URL -> clipboard fallback)
 *   - src/native/share-sheet.web.ts      (navigator.share -> clipboard fallback)
 *   - src/native/share-sheet.types.ts    (re-exports the types here)
 *
 * INVARIANTS (asserted by `test/unit/native/share-sheet.test.ts`):
 *   B1. Native module name is the literal string 'ShareSheet'.
 *       Distinct from prior modules:
 *         - 013 'AppIntents'
 *         - 014/027/028 'WidgetCenter'
 *         - 029 'FocusFilters'
 *         - 030 'BackgroundTasks'
 *         - 031 'Spotlight'
 *         - 032 'QuickLook'
 *   B2. On iOS, `present(opts)` delegates to the native
 *       `ShareSheet.present` AsyncFunction and resolves with
 *       { activityType: string | null, completed: boolean }.
 *   B3. `present()` calls are serialised through a single closure-
 *       scoped promise chain inherited verbatim from 030 / 031 / 032
 *       `enqueue` helper. Two back-to-back `present()` calls produce
 *       native invocations in submission order even if the first
 *       rejects (research §1 / R-A). The serialisation applies on
 *       all three platforms.
 *   B4. `isAvailable()` is NOT serialised; it is a pure synchronous
 *       read returning `true` on iOS / Android / Web (a usable share
 *       path always exists via clipboard fallback at minimum).
 *   B5. On Android with `content.kind === 'file'`, the bridge calls
 *       `expo-sharing.shareAsync(uri)` and resolves with
 *       { activityType: null, completed: true }. On error, resolves
 *       with { activityType: null, completed: false }.
 *   B6. On Android with `content.kind === 'text' | 'url'`, the bridge
 *       calls `expo-clipboard.setStringAsync(value)` and resolves
 *       with { activityType: 'android.clipboard-fallback', completed:
 *       true }.
 *   B7. On Web with `'share' in navigator`, the bridge calls
 *       `navigator.share({...})` and resolves with { activityType:
 *       null, completed: true }. AbortError -> { completed: false }.
 *       Other rejections -> falls through to clipboard.
 *   B8. On Web without `navigator.share`, the bridge calls
 *       `expo-clipboard.setStringAsync(value)` and resolves with
 *       { activityType: 'web.clipboard-fallback', completed: true }.
 *   B9. `ShareSheetNotSupported` is thrown ONLY when caller-side
 *       capabilities (non-empty `excludedActivityTypes`,
 *       `includeCustomActivity: true`, or non-null `anchor`) are
 *       requested on a non-iOS platform. The basic share path NEVER
 *       throws this error (FR-019).
 */

export const NATIVE_MODULE_NAME = 'ShareSheet' as const;

/** See data-model.md Entity 1. */
export type ShareContent =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'url'; readonly url: string }
  | {
      readonly kind: 'image';
      readonly source: number;
      readonly alt: string;
    }
  | {
      readonly kind: 'file';
      readonly uri: string;
      readonly name: string;
      readonly mimeType: string;
      readonly size: number;
    };

/** See data-model.md Entity 4. */
export interface AnchorRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** See data-model.md Entity 2. */
export interface ShareOptions {
  readonly content: ShareContent;
  readonly excludedActivityTypes: readonly string[];
  readonly includeCustomActivity: boolean;
  readonly anchor: AnchorRect | null;
}

/** See data-model.md Entity 3. */
export interface ShareResult {
  readonly activityType: string | null;
  readonly completed: boolean;
}

/**
 * Typed error class thrown ONLY when iOS-only capabilities are
 * requested on a non-iOS platform (B9). Consumers MAY
 * `instanceof`-check.
 *
 * Exported from `src/native/share-sheet.types.ts` so that all three
 * sibling implementations (ios / android / web) share the same
 * class identity.
 */
export declare class ShareSheetNotSupported extends Error {
  readonly name: 'ShareSheetNotSupported';
  constructor(message?: string);
}

export interface ShareSheetBridge {
  /**
   * Returns `true` on every supported platform (a usable share path
   * always exists, via clipboard fallback at minimum).
   * Pure read; never throws.
   */
  readonly isAvailable: () => boolean;

  /**
   * Presents the share UI per the platform variant (UIActivityViewController
   * on iOS, expo-sharing or clipboard on Android, navigator.share or
   * clipboard on Web). Resolves with the outcome envelope.
   *
   * @throws ShareSheetNotSupported when caller-side iOS-only
   *         capabilities (non-empty `excludedActivityTypes`,
   *         `includeCustomActivity: true`, or non-null `anchor`)
   *         are requested on a non-iOS platform.
   * @throws Error on iOS when the native presenter rejects (e.g.,
   *         no root view controller available, missing iPad anchor).
   */
  readonly present: (opts: ShareOptions) => Promise<ShareResult>;
}
