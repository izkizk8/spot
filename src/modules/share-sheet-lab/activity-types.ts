/**
 * Activity Types Catalog - iOS UIActivity.ActivityType constants
 * Feature: 033-share-sheet
 *
 * Hand-curated, frozen catalog of 12 well-known iOS activity types
 * plus 2 synthetic platform-fallback entries.
 *
 * @see specs/033-share-sheet/data-model.md Entity 5, Entity 6
 * @see specs/033-share-sheet/research.md §8
 */

export interface ActivityTypeCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly synthetic?: 'web.clipboard-fallback' | 'android.clipboard-fallback';
}

export interface ExcludedActivitySelection {
  /** Set of activity-type ids the user has checked. */
  readonly checked: ReadonlySet<string>;
  /** True when the "Hide all" master toggle is on. */
  readonly hideAll: boolean;
}

/**
 * Full catalog: 12 iOS built-ins + 2 synthetic fallback entries.
 *
 * @see specs/033-share-sheet/research.md §8 for the 12 iOS entries
 */
export const ACTIVITY_TYPES_CATALOG: readonly ActivityTypeCatalogEntry[] = [
  // 12 iOS built-in activities (iOS 8+)
  { id: 'com.apple.UIKit.activity.Mail', label: 'Mail' },
  { id: 'com.apple.UIKit.activity.Print', label: 'Print' },
  { id: 'com.apple.UIKit.activity.AirDrop', label: 'AirDrop' },
  { id: 'com.apple.UIKit.activity.Message', label: 'Message' },
  { id: 'com.apple.UIKit.activity.AddToReadingList', label: 'Add to Reading List' },
  { id: 'com.apple.UIKit.activity.AssignToContact', label: 'Assign to Contact' },
  { id: 'com.apple.UIKit.activity.CopyToPasteboard', label: 'Copy' },
  { id: 'com.apple.UIKit.activity.PostToFacebook', label: 'Post to Facebook' },
  { id: 'com.apple.UIKit.activity.PostToTwitter', label: 'Post to Twitter' },
  { id: 'com.apple.UIKit.activity.SaveToCameraRoll', label: 'Save Image' },
  { id: 'com.apple.UIKit.activity.OpenInIBooks', label: 'Open in Books' },
  { id: 'com.apple.UIKit.activity.MarkupAsPDF', label: 'Markup' },

  // 2 synthetic platform-fallback entries
  {
    id: 'web.clipboard-fallback',
    label: 'Copy (Web fallback)',
    synthetic: 'web.clipboard-fallback',
  },
  {
    id: 'android.clipboard-fallback',
    label: 'Copy (Android fallback)',
    synthetic: 'android.clipboard-fallback',
  },
] as const;

/**
 * Named export for the web clipboard fallback entry.
 * Used by the Web bridge variant.
 */
export const WEB_CLIPBOARD_FALLBACK = ACTIVITY_TYPES_CATALOG.find(
  (e) => e.id === 'web.clipboard-fallback',
)!;

/**
 * Derive the excludedActivityTypes array from the user's selection.
 * Filters out synthetic entries (they're not real iOS activities).
 *
 * @see specs/033-share-sheet/data-model.md Entity 6
 */
export function deriveExcludedActivityTypes(
  catalog: readonly ActivityTypeCatalogEntry[],
  selection: ExcludedActivitySelection,
): string[] {
  if (selection.hideAll) {
    return catalog.filter((e) => !e.synthetic).map((e) => e.id);
  }
  return catalog.filter((e) => !e.synthetic && selection.checked.has(e.id)).map((e) => e.id);
}
