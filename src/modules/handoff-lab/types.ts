/**
 * TypeScript types for the handoff-lab module (040).
 * Mirrors data-model.md §1–§4.
 */

/**
 * The contract shape used by the composer, the JS bridge, and the native bridge.
 */
export interface ActivityDefinition {
  /** Reverse-DNS string. MUST appear in Info.plist NSUserActivityTypes. */
  activityType: string;

  /** User-visible title surfaced on the receiving device. */
  title: string;

  /** Optional. If set and parseable, becomes the activity's webpageURL. */
  webpageURL?: string;

  /** Free-form payload. Keys are arbitrary strings; values are strings at composer level. */
  userInfo: Record<string, string>;

  /** Subset of Object.keys(userInfo). OS may decline if required keys are missing. */
  requiredUserInfoKeys: string[];

  /** Whether the activity is eligible for Handoff (default true). */
  isEligibleForHandoff: boolean;

  /** Whether the activity is eligible for Spotlight search (iOS 9+). */
  isEligibleForSearch: boolean;

  /** Whether the activity is eligible for Siri prediction (iOS 12+). */
  isEligibleForPrediction: boolean;
}

/**
 * Payload prepended into IncomingLog when AppDelegate forwards a continuation event.
 */
export interface ContinuationEvent {
  activityType: string;
  title: string;
  webpageURL?: string;

  /** Free-form payload from the sending device. Values are unknown (any plist-safe type). */
  userInfo: Record<string, unknown>;

  /** Sorted, deduplicated; native side guarantees this. */
  requiredUserInfoKeys: string[];

  /** Generated client-side with new Date().toISOString(). */
  receivedAt: string;
}

/**
 * The slice exposed by useHandoffActivity().
 */
export interface HookState {
  /** Mirror of the last successfully made-current activity. */
  currentActivity: ActivityDefinition | null;

  /** Most recent first; max length 10 (FR-014). */
  log: ContinuationEvent[];

  /** False on Android / Web; true on iOS. */
  isAvailable: boolean;
}
