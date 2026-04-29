/**
 * Contract: Expo config plugin invariants for `with-documents`.
 *
 * @feature 032-document-picker-quicklook
 * @see specs/032-document-picker-quicklook/spec.md FR-015, FR-016
 * @see specs/032-document-picker-quicklook/research.md §4 (R-D scope)
 *
 * Implementation files:
 *   - plugins/with-documents/index.ts
 *   - plugins/with-documents/package.json
 *
 * INVARIANTS (asserted by `test/unit/plugins/with-documents/index.test.ts`):
 *
 *   P1. SCOPE — The plugin mutates EXACTLY TWO `Info.plist` keys:
 *         - `LSSupportsOpeningDocumentsInPlace`
 *         - `UIFileSharingEnabled`
 *       It does NOT mutate any of:
 *         - `NSUserActivityTypes`                   (031-owned)
 *         - `BGTaskSchedulerPermittedIdentifiers`   (030-owned)
 *         - `UIBackgroundModes`                     (025/030-owned)
 *         - any `NS*UsageDescription` permission    (017/018/020/025/026-owned)
 *         - any entitlement (App Group, push, Sign in with Apple)
 *           (014/019/021/027/028-owned)
 *         - `pbxproj` Sources / Frameworks / build settings
 *           (R-D: framework linkage via autolinking)
 *
 *   P2. CREATE-IF-ABSENT — When either managed key is absent on the
 *       input plist, the plugin sets it to `true`. (FR-015)
 *
 *   P3. NO-OP-IF-ALREADY-TRUE — When either managed key is already
 *       `true`, the plugin's assignment is a structural no-op
 *       (byte-identical post-mutation plist). Asserted by `toEqual`
 *       against the input plist. (FR-015 / SC-003)
 *
 *   P4. OVERWRITE-IF-DIFFERENT — When either managed key exists
 *       with a value other than `true` (e.g. `false`), the plugin
 *       overwrites that key to `true`. Other keys MUST remain
 *       byte-identical. (FR-015)
 *
 *   P5. IDEMPOTENT — Running the plugin twice in succession on
 *       the same input plist produces a byte-identical result.
 *       Asserted by `toEqual` against the first-run output, not
 *       `toContain`. (FR-015 / SC-003)
 *
 *   P6. PRIOR-PLUGIN COEXISTENCE — Running 032's plugin AFTER
 *       every prior plugin (007 / 013 / 014 / 019 / 021 / 022 /
 *       023 / 024 / 025 / 026 / 027 / 028 / 029 / 030 / 031 plus
 *       every earlier plugin already in the array — 31 in total)
 *       in `app.json` declaration order yields an `Info.plist`
 *       that:
 *         (a) contains both managed keys with value `true`, AND
 *         (b) is byte-identical to the result of running the prior
 *             pipeline ALONE for every key OTHER than the two
 *             managed keys.
 *       Asserted by `toEqual` against a reference fixture; (b) is
 *       checked by removing the two managed keys from both the
 *       observed and the reference plist and asserting full
 *       equality on the remainder. (FR-016 / SC-003)
 *
 *   P7. COMMUTATIVITY — The plugin is commutative with prior
 *       plugins across at least three sampled non-trivial
 *       orderings (e.g. before-all, middle, after-all). Asserted
 *       by `toEqual` against a reference final plist. (FR-016)
 *
 *   P8. NO `pbxproj` MUTATION — The plugin does NOT call
 *       `withXcodeProject`, does NOT add `QuickLook.framework` to
 *       any target's Frameworks phase, and does NOT modify
 *       `pbxproj` in any way. Framework linkage is supplied by the
 *       Swift sources' autolinking pipeline (R-D). Asserted by
 *       ensuring the plugin's only mod call is `withInfoPlist`.
 *
 *   P9. NO ENTITLEMENT MUTATION — The plugin does NOT call
 *       `withEntitlementsPlist`. Background-mode / App Group /
 *       push entitlements remain owned by their respective
 *       feature plugins.
 */

import type { ConfigPlugin } from '@expo/config-plugins';

/**
 * The plugin takes no options. Future extension points (e.g. an
 * opt-out for `UIFileSharingEnabled` if a downstream fork needs to
 * keep the Files app integration disabled) are out of scope for
 * v1; the type is `void` to make the intentional unused-options
 * surface explicit.
 */
export type WithDocumentsOptions = void;

/**
 * The plugin's exported default. The Expo CLI invokes it with the
 * project's `ExpoConfig`; the plugin returns the augmented config
 * with `Info.plist`'s two managed keys set to `true` per P1..P9.
 */
export type WithDocumentsPlugin = ConfigPlugin<WithDocumentsOptions>;

/** Frozen literals for the two managed keys. */
export const KEY_OPEN_IN_PLACE = 'LSSupportsOpeningDocumentsInPlace' as const;
export const KEY_FILE_SHARING = 'UIFileSharingEnabled' as const;

/** Both keys are set to `true` unconditionally per P2 / P4. */
export const MANAGED_VALUE = true as const;
