/**
 * with-screentime/add-entitlement.ts
 *
 * Adds the `com.apple.developer.family-controls` entitlement to the main
 * iOS app target's `.entitlements` file.
 *
 * IMPORTANT: This entitlement is gated by Apple approval. The build will
 * succeed locally without approval, but TestFlight / App Store distribution
 * will be rejected until Apple grants the entitlement to your team.
 * See specs/015-screentime-api/quickstart.md (FR-019).
 *
 * Idempotent.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withEntitlementsPlist } = configPlugins;
export const FAMILY_CONTROLS_KEY = 'com.apple.developer.family-controls';

export const withScreenTimeEntitlement: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    cfg.modResults[FAMILY_CONTROLS_KEY] = true;
    return cfg;
  });
};

export default withScreenTimeEntitlement;
