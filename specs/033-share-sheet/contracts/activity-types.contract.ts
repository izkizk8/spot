/**
 * Contract: activity-types catalog.
 *
 * @feature 033-share-sheet
 * @see specs/033-share-sheet/spec.md FR-008
 * @see specs/033-share-sheet/data-model.md Entity 5
 * @see specs/033-share-sheet/research.md §8 (catalog scope)
 *
 * Implementation file:
 *   - src/modules/share-sheet-lab/activity-types.ts
 *
 * INVARIANTS (asserted by `activity-types.test.ts`):
 *   A1. The catalog contains exactly 12 iOS entries.
 *   A2. The catalog contains exactly 2 synthetic entries
 *       ('web.clipboard-fallback' and 'android.clipboard-fallback').
 *   A3. No duplicate `id` values across the entire catalog.
 *   A4. Every iOS entry's `id` matches /^com\.apple\.UIKit\.activity\.[A-Za-z]+$/.
 *   A5. Every synthetic entry's `id` matches /^(web|android)\.clipboard-fallback$/
 *       and has `synthetic` set to that same string.
 *   A6. Every entry has a non-empty `label` string.
 *   A7. The catalog is exported as `readonly` (`as const`) and has
 *       no mutation methods.
 */

export interface ActivityTypeCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly synthetic?: 'web.clipboard-fallback' | 'android.clipboard-fallback';
}

/** Synthetic activity-type strings emitted by non-iOS bridge variants. */
export const WEB_CLIPBOARD_FALLBACK = 'web.clipboard-fallback' as const;
export const ANDROID_CLIPBOARD_FALLBACK = 'android.clipboard-fallback' as const;

/**
 * The 12 stable post-iOS-8 activity types, plus the two synthetic
 * fallback entries. Hand-curated; see research §8 for inclusion
 * criteria and rejected alternatives.
 *
 * The exact ids/labels are documented for spec stability; the test
 * asserts the set of ids equals this exact list (toEqual against a
 * frozen reference array).
 */
export const EXPECTED_IOS_ACTIVITY_IDS: readonly string[] = [
  'com.apple.UIKit.activity.Mail',
  'com.apple.UIKit.activity.Print',
  'com.apple.UIKit.activity.AirDrop',
  'com.apple.UIKit.activity.Message',
  'com.apple.UIKit.activity.AddToReadingList',
  'com.apple.UIKit.activity.AssignToContact',
  'com.apple.UIKit.activity.CopyToPasteboard',
  'com.apple.UIKit.activity.PostToFacebook',
  'com.apple.UIKit.activity.PostToTwitter',
  'com.apple.UIKit.activity.SaveToCameraRoll',
  'com.apple.UIKit.activity.OpenInIBooks',
  'com.apple.UIKit.activity.MarkupAsPDF',
] as const;

export const EXPECTED_SYNTHETIC_IDS: readonly string[] = [
  WEB_CLIPBOARD_FALLBACK,
  ANDROID_CLIPBOARD_FALLBACK,
] as const;

/**
 * Pure helper: derives the `excludedActivityTypes` payload from the
 * picker selection. Synthetic entries are NEVER included (they're
 * not real iOS activities).
 *
 * @see data-model.md Entity 6 (`ExcludedActivitySelection`)
 */
export type DeriveExcludedActivityTypes = (
  catalog: readonly ActivityTypeCatalogEntry[],
  selection: { readonly checked: ReadonlySet<string>; readonly hideAll: boolean },
) => string[];
