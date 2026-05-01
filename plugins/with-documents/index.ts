/**
 * with-documents — Expo config plugin for feature 032.
 *
 * Single `withInfoPlist` mutation: sets two managed keys to `true`:
 *   - LSSupportsOpeningDocumentsInPlace
 *   - UIFileSharingEnabled
 *
 * Idempotent (P5), commutative with all 31 prior plugins (P6/P7),
 * does NOT mutate pbxproj (P8) or entitlements (P9). Framework
 * linkage for QuickLook.framework is supplied by the Swift sources'
 * autolinking pipeline.
 *
 * @see specs/032-document-picker-quicklook/contracts/with-documents-plugin.contract.ts
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
export const KEY_OPEN_IN_PLACE = 'LSSupportsOpeningDocumentsInPlace' as const;
export const KEY_FILE_SHARING = 'UIFileSharingEnabled' as const;
export const MANAGED_VALUE = true as const;

/**
 * Pure mutation: returns a new plist with the two managed keys set
 * to `true`. Other keys are preserved.
 */
export function applyDocumentsInfoPlist(input: Record<string, unknown>): Record<string, unknown> {
  return {
    ...input,
    [KEY_OPEN_IN_PLACE]: MANAGED_VALUE,
    [KEY_FILE_SHARING]: MANAGED_VALUE,
  };
}

const withDocuments: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    mod.modResults = applyDocumentsInfoPlist(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withDocuments;
