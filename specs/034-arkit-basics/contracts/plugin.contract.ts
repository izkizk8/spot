/**
 * Contract: `with-arkit` Expo config plugin.
 *
 * @feature 034-arkit-basics
 * @see specs/034-arkit-basics/spec.md FR-017, FR-018
 * @see specs/034-arkit-basics/research.md §6 (R-F idempotency +
 *      coexistence proof)
 *
 * Implementation files:
 *   - plugins/with-arkit/index.ts
 *   - plugins/with-arkit/package.json
 *
 * INVARIANTS (asserted by `test/unit/plugins/with-arkit.test.ts`):
 *   P1. The default export is a `ConfigPlugin` from
 *       `@expo/config-plugins`.
 *   P2. The plugin uses ONLY `withInfoPlist`. It does NOT use
 *       `withDangerousMod`, `withEntitlementsPlist`,
 *       `withAndroidManifest`, or any other mod (additive +
 *       reviewable surface).
 *   P3. NSCameraUsageDescription:
 *       a. When the key is ABSENT in the input config, the plugin
 *          sets it to the string
 *          'Used to demonstrate ARKit world tracking and plane detection.'
 *       b. When the key is PRESENT (even with an empty string), the
 *          plugin leaves it UNCHANGED. (Feature 017's `with-vision`
 *          coexistence — SC-009.)
 *   P4. UIRequiredDeviceCapabilities:
 *       a. When the key is ABSENT, the plugin sets it to ['arkit'].
 *       b. When the key is PRESENT as an array NOT containing
 *          'arkit', the plugin appends 'arkit' (preserving prior
 *          entries in order).
 *       c. When the key is PRESENT as an array CONTAINING 'arkit',
 *          the plugin is a no-op for that key.
 *   P5. Idempotency: running the plugin twice on the same input
 *       produces a deep-equal output. SC-008.
 *   P6. No face-tracking strings: after the plugin runs,
 *       `cfg.modResults` MUST NOT contain any new key matching
 *       /face|FaceID/i (FR-017 stipulation). Pre-existing keys (if
 *       any) are NOT removed.
 *   P7. The plugin is added to `app.json` `plugins[]` as the string
 *       `'./plugins/with-arkit'` (relative path; no options).
 *       Adding it grows `expo.plugins.length` by exactly 1.
 *
 * Pseudo-signature:
 *
 *   import type { ConfigPlugin } from '@expo/config-plugins';
 *   const withArkit: ConfigPlugin = (config) => withInfoPlist(config, (cfg) => {
 *     // (P3) preserve existing camera string, default if absent
 *     // (P4) dedup-append 'arkit' to UIRequiredDeviceCapabilities
 *     return cfg;
 *   });
 *   export default withArkit;
 */

import type { ConfigPlugin } from '@expo/config-plugins';

export type WithArkitPlugin = ConfigPlugin;

export const DEFAULT_CAMERA_USAGE_DESCRIPTION =
  'Used to demonstrate ARKit world tracking and plane detection.' as const;

export const ARKIT_CAPABILITY = 'arkit' as const;
