/**
 * with-icloud-drive — Expo config plugin for feature 070
 * (iCloud Drive Lab module).
 *
 * Prebuild-time operations (all idempotent, all merge-and-preserve):
 *
 *   Entitlements (via withEntitlementsPlist):
 *   1. `com.apple.developer.icloud-container-identifiers` →
 *      `['iCloud.<bundleId>']`
 *   2. `com.apple.developer.ubiquity-container-identifiers` →
 *      `['iCloud.<bundleId>']`
 *
 *   Info.plist (via withInfoPlist):
 *   3. `NSUbiquitousContainers` — declares the container to the system
 *      so NSMetadataQuery can discover documents.
 *
 * Real iCloud provisioning is out of scope; the entitlements are
 * added so a developer with the appropriate Apple Developer Program
 * enrollment can configure the container in Xcode.
 *
 * Running the plugin twice on the same Expo config produces a
 * deep-equal config (idempotent).
 *
 * Coexists with all prior plugins without modifying their targets,
 * entitlements, or App Groups.
 *
 * @see specs/070-icloud-drive/tasks.md T011
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist, withInfoPlist } from '@expo/config-plugins';

export const ICLOUD_CONTAINERS_KEY = 'com.apple.developer.icloud-container-identifiers' as const;
export const UBIQUITY_CONTAINERS_KEY =
  'com.apple.developer.ubiquity-container-identifiers' as const;
export const NS_UBIQUITOUS_KEY = 'NSUbiquitousContainers' as const;

function asStringArray(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === 'string')) return null;
  return value as readonly string[];
}

function mergeContainerId(
  entitlements: Record<string, unknown>,
  key: string,
  containerId: string,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...entitlements };
  const existing = asStringArray(next[key]);
  if (existing === null) {
    if (next[key] === undefined) {
      next[key] = [containerId];
    }
    return next;
  }
  if (existing.includes(containerId)) return next;
  next[key] = [...existing, containerId];
  return next;
}

/**
 * Pure helper: apply both iCloud container entitlement keys.
 * Exported for direct unit testing without the full Expo mod chain.
 */
export function applyICloudDriveEntitlements(
  entitlements: Record<string, unknown>,
  bundleIdentifier: string | undefined,
): Record<string, unknown> {
  if (!bundleIdentifier) return { ...entitlements };
  const containerId = `iCloud.${bundleIdentifier}`;
  let next = mergeContainerId(entitlements, ICLOUD_CONTAINERS_KEY, containerId);
  next = mergeContainerId(next, UBIQUITY_CONTAINERS_KEY, containerId);
  return next;
}

/**
 * Pure helper: insert NSUbiquitousContainers into Info.plist.
 * Exported for direct unit testing without the full Expo mod chain.
 */
export function applyNSUbiquitousContainers(
  infoPlist: Record<string, unknown>,
  bundleIdentifier: string | undefined,
): Record<string, unknown> {
  if (!bundleIdentifier) return { ...infoPlist };
  const containerId = `iCloud.${bundleIdentifier}`;
  const next: Record<string, unknown> = { ...infoPlist };
  if (next[NS_UBIQUITOUS_KEY] !== undefined) return next;
  next[NS_UBIQUITOUS_KEY] = {
    [containerId]: {
      NSUbiquitousContainerIsDocumentScopePublic: true,
      NSUbiquitousContainerName: 'iCloud Drive Lab',
      NSUbiquitousContainerSupportedFolderLevels: 'Any',
    },
  };
  return next;
}

const withICloudDrive: ConfigPlugin = (config) => {
  let result = withEntitlementsPlist(config, (cfg) => {
    cfg.modResults = applyICloudDriveEntitlements(
      cfg.modResults as Record<string, unknown>,
      cfg.ios?.bundleIdentifier,
    ) as typeof cfg.modResults;
    return cfg;
  });

  result = withInfoPlist(result, (cfg) => {
    cfg.modResults = applyNSUbiquitousContainers(
      cfg.modResults as Record<string, unknown>,
      cfg.ios?.bundleIdentifier,
    ) as typeof cfg.modResults;
    return cfg;
  });

  return result;
};

export default withICloudDrive;
