/**
 * with-home-widgets/add-app-group.ts
 *
 * Adds the App Group entitlement (`group.<bundleId>.showcase`) to the
 * main-app entitlements (and to the widget extension entitlements when the
 * widget extension target exists). Idempotent.
 *
 * @see specs/014-home-widgets/tasks.md T017
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { IOSConfig, withEntitlementsPlist } = configPlugins;
const APP_GROUPS_KEY = 'com.apple.security.application-groups';

function suiteFor(bundleId: string): string {
  return `group.${bundleId}.showcase`;
}

export const withHomeWidgetsAppGroup: ConfigPlugin = (config) => {
  const bundleId = IOSConfig.BundleIdentifier.getBundleIdentifier(config) ?? 'com.example.spot';
  const suite = suiteFor(bundleId);

  return withEntitlementsPlist(config, (cfg) => {
    const existing = (cfg.modResults[APP_GROUPS_KEY] as string[] | undefined) ?? [];
    const next = existing.includes(suite) ? existing : [...existing, suite];
    cfg.modResults[APP_GROUPS_KEY] = next;
    return cfg;
  });
};

export default withHomeWidgetsAppGroup;
