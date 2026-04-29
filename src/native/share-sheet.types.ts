/**
 * Share Sheet Types - Foundational types for feature 033
 * Feature: 033-share-sheet
 *
 * Exported types and error class shared across all platform variants.
 * Re-exports the contract types from specs/033-share-sheet/contracts/.
 *
 * @see specs/033-share-sheet/data-model.md Entities 1–4
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts
 * @see specs/033-share-sheet/contracts/native-module.contract.ts
 */

export const NATIVE_MODULE_NAME = 'ShareSheet' as const;

/**
 * Entity 1 — ShareContent
 * Discriminated union describing a single shareable payload.
 *
 * @see specs/033-share-sheet/data-model.md Entity 1
 */
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

/**
 * Entity 4 — AnchorRect
 * iPad-only popover source rectangle.
 *
 * @see specs/033-share-sheet/data-model.md Entity 4
 */
export interface AnchorRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Entity 2 — ShareOptions
 * Full payload passed to bridge's present() method.
 *
 * @see specs/033-share-sheet/data-model.md Entity 2
 */
export interface ShareOptions {
  readonly content: ShareContent;
  readonly excludedActivityTypes: readonly string[];
  readonly includeCustomActivity: boolean;
  readonly anchor: AnchorRect | null;
}

/**
 * Entity 3 — ShareResult
 * Native bridge's resolved value.
 *
 * @see specs/033-share-sheet/data-model.md Entity 3
 */
export interface ShareResult {
  readonly activityType: string | null;
  readonly completed: boolean;
}

/**
 * ShareSheetNotSupported
 * Typed error class thrown when iOS-only capabilities are requested
 * on non-iOS platforms.
 *
 * Invariants:
 *   - Thrown ONLY for caller-side capability requests (non-empty
 *     excludedActivityTypes, includeCustomActivity: true, or non-null
 *     anchor on Android/Web).
 *   - The basic share path NEVER throws this error (FR-019).
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts B9
 */
export class ShareSheetNotSupported extends Error {
  public readonly name = 'ShareSheetNotSupported' as const;

  constructor(message?: string) {
    super(message ?? 'Share Sheet feature is not supported on this platform');
    // Restore prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, ShareSheetNotSupported.prototype);
  }
}

/**
 * ShareSheetBridge
 * Platform-agnostic bridge interface.
 *
 * @see specs/033-share-sheet/contracts/share-sheet-bridge.contract.ts
 */
export interface ShareSheetBridge {
  /**
   * Returns true on every supported platform (a usable share path
   * always exists via clipboard fallback at minimum).
   * Pure read; never throws.
   */
  readonly isAvailable: () => boolean;

  /**
   * Presents the share UI per the platform variant.
   *
   * @throws ShareSheetNotSupported when caller-side iOS-only
   *         capabilities are requested on non-iOS platform.
   * @throws Error on iOS when native presenter rejects.
   */
  readonly present: (opts: ShareOptions) => Promise<ShareResult>;
}
