/**
 * Activity-types constant for the handoff-lab module (040).
 *
 * Exported for plugin usage in `plugins/with-handoff/index.ts`.
 */

/**
 * The activity type registered in Info.plist `NSUserActivityTypes`.
 * Must be a reverse-DNS string; registered by the `with-handoff` plugin.
 */
export const HANDOFF_DEMO_ACTIVITY_TYPE = 'com.izkizk8.spot.activity.handoff-demo' as const;

/**
 * Type-only re-export from data-model (T003 requirement).
 */
export type { ActivityDefinition } from './types';
