/**
 * QuickLook Bridge Types
 * Feature: 032-document-picker-quicklook
 *
 * Shared types for the Quick Look bridge, imported safely on every
 * platform (no native module access at evaluation time).
 *
 * @see specs/032-document-picker-quicklook/contracts/quicklook-bridge.contract.ts
 * @see specs/032-document-picker-quicklook/data-model.md Entity 5, 6
 */

/**
 * Native module name for Quick Look (B1).
 * Distinct from prior bridges:
 *   - 013: 'AppIntents'
 *   - 014/027/028: 'WidgetCenter'
 *   - 029: 'FocusFilters'
 *   - 030: 'BackgroundTasks'
 *   - 031: 'Spotlight'
 */
export const NATIVE_MODULE_NAME = 'QuickLook' as const;

/**
 * Output of `present(uri:)`. Native side resolves this exactly once
 * the preview sheet appears (B5).
 */
export interface QuickLookPresentResult {
  readonly shown: true;
}

/**
 * Typed error class for cross-platform branching at the import
 * boundary. Thrown on Android/Web and iOS < 11 (B2).
 *
 * FR-014: Consumers MAY `instanceof`-check.
 */
export class QuickLookNotSupported extends Error {
  public readonly name = 'QuickLookNotSupported' as const;

  constructor(message = 'Quick Look is not supported on this platform') {
    super(message);
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, QuickLookNotSupported.prototype);
    // Freeze name property to ensure stability
    Object.defineProperty(this, 'name', {
      value: 'QuickLookNotSupported',
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
}

/**
 * Bridge interface for Quick Look operations (B3, B4).
 */
export interface QuickLookBridge {
  /**
   * Returns `true` on iOS 11+ when the native module is loadable.
   * Returns `false` on Android, Web, and iOS < 11 (synchronously).
   * Pure read; never throws (B4).
   */
  readonly isAvailable: () => boolean;

  /**
   * Presents `QLPreviewController` modally over the current root
   * view controller, sourcing its single preview item from the
   * supplied URI. Resolves with `{ shown: true }` once the sheet
   * appears (B5).
   *
   * Calls are serialised through a single promise chain (B3 / R-A).
   *
   * @throws QuickLookNotSupported on non-iOS / iOS < 11 (B2).
   * @throws Error (with code in message) on iOS when the URI
   *         is invalid, the file is unreadable, no root view
   *         controller is available, or `QLPreviewController`
   *         rejects the item (B5 / data-model.md Entity 5).
   */
  readonly present: (uri: string) => Promise<QuickLookPresentResult>;
}
