/**
 * Contract: Expo config plugin invariants for `with-spotlight`.
 *
 * @feature 031-spotlight-indexing
 * @see specs/031-spotlight-indexing/spec.md FR-110..113, AC-SPL-008
 * @see specs/031-spotlight-indexing/research.md §4 (R-D union-merge ordering)
 * @see specs/031-spotlight-indexing/research.md §5 (R-E framework linkage)
 *
 * Implementation file:
 *   - plugins/with-spotlight/index.ts
 *   - plugins/with-spotlight/package.json
 *
 * INVARIANTS (asserted by `test/unit/plugins/with-spotlight/index.test.ts`):
 *
 *   P1. SCOPE — The plugin mutates EXACTLY ONE `Info.plist` key:
 *       `NSUserActivityTypes`. It does NOT mutate any of:
 *         - `BGTaskSchedulerPermittedIdentifiers`     (030-owned)
 *         - `UIBackgroundModes`                       (025/030-owned)
 *         - any entitlement (App Group, push, Sign in with Apple) (014/019/027/028-owned)
 *         - `pbxproj` Sources / Frameworks / build settings   (R-E: framework linkage via autolinking)
 *
 *   P2. CREATE-IF-ABSENT — When `NSUserActivityTypes` does not
 *       exist on the input plist, the plugin creates it with the
 *       single entry `[ACTIVITY_TYPE]`. (FR-110)
 *
 *   P3. UNION-MERGE — When `NSUserActivityTypes` exists, the
 *       plugin appends `ACTIVITY_TYPE` to the array IF AND ONLY IF
 *       it is not already present. The relative order of every
 *       prior entry is preserved verbatim. (FR-113 / R-D)
 *
 *   P4. IDEMPOTENT — Running the plugin twice in succession on
 *       the same input plist produces a byte-identical result.
 *       Asserted by `toEqual` against the first-run output, not
 *       `toContain`. (FR-112 / SC-005)
 *
 *   P5. PRIOR-PLUGIN COEXISTENCE — Running 031's plugin AFTER
 *       every prior plugin (007 / 013 / 014 / 019 / 023 / 025 /
 *       026 / 027 / 028 / 029 / 030) in `app.json` declaration
 *       order yields an `Info.plist` whose `NSUserActivityTypes`
 *       is a superset containing `ACTIVITY_TYPE`, and whose every
 *       OTHER key (mutated by prior plugins) is byte-identical to
 *       the result of running the prior pipeline alone. (FR-113 /
 *       SC-008)
 *
 *   P6. COMMUTATIVITY — The plugin is commutative with prior
 *       plugins across at least three sampled non-trivial
 *       orderings (e.g. before-all, middle, after-all). Asserted
 *       by `toEqual` against a reference final plist. (FR-113)
 *
 *   P7. NO PRIOR-ENTRY CLOBBER — When seeded with a prior
 *       `NSUserActivityTypes: ['com.example.priorActivity']`, the
 *       post-mutation array is exactly
 *       `['com.example.priorActivity', ACTIVITY_TYPE]` by
 *       `toEqual` (NOT `toContain`). The prior entry's index is
 *       preserved at 0. (R-D)
 *
 *   P8. NO FRAMEWORK MUTATION — The plugin does NOT call
 *       `withXcodeProject`, does NOT add
 *       `CoreSpotlight.framework` to any target's Frameworks
 *       phase, and does NOT modify `pbxproj` in any way.
 *       Framework linkage is supplied by the Swift sources'
 *       autolinking pipeline (R-E). Asserted by ensuring the
 *       plugin's only `withInfoPlist` call mutates exclusively
 *       `NSUserActivityTypes`.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { ACTIVITY_TYPE } from './spotlight-bridge.contract';

/** Re-exported for tests so they can assert the literal. */
export { ACTIVITY_TYPE };

/**
 * The plugin takes no options. Future extension points (e.g. a
 * second activity type for a sibling demo) are out of scope for
 * v1; the type is `void` to make the intentional unused-options
 * surface explicit.
 */
export type WithSpotlightOptions = void;

/**
 * The plugin's exported default. The Expo CLI invokes it with the
 * project's `ExpoConfig`; the plugin returns the augmented config
 * with `Info.plist`'s `NSUserActivityTypes` extended per P1..P8.
 */
export type WithSpotlightPlugin = ConfigPlugin<WithSpotlightOptions>;

/**
 * Pure helper exported from the plugin (re-exported for testing).
 * Implements P3 / P4 / P7. Inherited verbatim from 030's R-D
 * `mergeUniqueAppending` shape.
 */
export type MergeUniqueAppending = (
  prior: readonly string[] | undefined,
  additions: readonly string[],
) => readonly string[];
