/**
 * with-coredata-cloudkit — Expo config plugin for feature 052
 * (Core Data + CloudKit Lab module).
 *
 * Prebuild-time operations (all idempotent, all merge-and-preserve):
 *
 *   1. `com.apple.developer.icloud-services` → `['CloudKit']`
 *   2. `com.apple.developer.icloud-container-identifiers` →
 *      `['iCloud.<bundleId>']`
 *   3. `aps-environment` → `'development'`
 *
 * Real iCloud provisioning is out of scope; the entitlements are
 * added so a developer with the appropriate Apple Developer Program
 * enrollment can configure the container in Xcode.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withEntitlementsPlist } = configPlugins;
export const ICLOUD_SERVICES_KEY = 'com.apple.developer.icloud-services' as const;
export const ICLOUD_CONTAINERS_KEY = 'com.apple.developer.icloud-container-identifiers' as const;
export const APS_ENVIRONMENT_KEY = 'aps-environment' as const;

export const CLOUDKIT_VALUE = 'CloudKit' as const;
export const APS_ENVIRONMENT_VALUE = 'development' as const;

function asStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === 'string')) return null;
  return value as readonly string[];
}

/**
 * Pure helper: merge `CloudKit` into the icloud-services array,
 * preserving any operator-supplied entries.
 */
export function applyICloudServices(
  entitlements: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entitlements };
  const existing = asStringArray(next[ICLOUD_SERVICES_KEY]);
  if (existing === null) {
    if (next[ICLOUD_SERVICES_KEY] === undefined) {
      next[ICLOUD_SERVICES_KEY] = [CLOUDKIT_VALUE];
    }
    return next;
  }
  if (existing.includes(CLOUDKIT_VALUE)) {
    return next;
  }
  next[ICLOUD_SERVICES_KEY] = [...existing, CLOUDKIT_VALUE];
  return next;
}

/**
 * Pure helper: ensure the bundle's iCloud container identifier
 * appears in the icloud-container-identifiers array.
 */
export function applyICloudContainers(
  entitlements: Record<string, unknown>,
  bundleIdentifier: string | undefined,
): Record<string, unknown> {
  if (!bundleIdentifier) return { ...entitlements };
  const containerId = `iCloud.${bundleIdentifier}`;
  const next: Record<string, unknown> = { ...entitlements };
  const existing = asStringArray(next[ICLOUD_CONTAINERS_KEY]);
  if (existing === null) {
    if (next[ICLOUD_CONTAINERS_KEY] === undefined) {
      next[ICLOUD_CONTAINERS_KEY] = [containerId];
    }
    return next;
  }
  if (existing.includes(containerId)) {
    return next;
  }
  next[ICLOUD_CONTAINERS_KEY] = [...existing, containerId];
  return next;
}

/**
 * Pure helper: insert the `aps-environment` key required for
 * CloudKit silent push, preserving operator-supplied values.
 */
export function applyApsEnvironment(
  entitlements: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entitlements };
  if (next[APS_ENVIRONMENT_KEY] === undefined) {
    next[APS_ENVIRONMENT_KEY] = APS_ENVIRONMENT_VALUE;
  }
  return next;
}

const withCoreDataCloudKit: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    let plist = cfg.modResults as Record<string, unknown>;
    plist = applyICloudServices(plist);
    plist = applyICloudContainers(plist, cfg.ios?.bundleIdentifier);
    plist = applyApsEnvironment(plist);
    cfg.modResults = plist as typeof cfg.modResults;
    return cfg;
  });
};

export default withCoreDataCloudKit;
