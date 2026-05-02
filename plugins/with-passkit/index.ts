/**
 * with-passkit — Expo config plugin for feature 036 (PassKit / Wallet module).
 *
 * Prebuild-time operations (all idempotent):
 *
 *   1. Set `com.apple.developer.pass-type-identifiers` entitlement to the
 *      placeholder array ONLY when absent (P2) — preserving any
 *      operator-supplied real Pass Type IDs (P3).
 *   2. Link `PassKit.framework` to the main target when not already linked
 *      (P4).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (P5 / SC-006).
 *
 * @see specs/036-passkit-wallet/contracts/with-passkit-plugin.md
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withEntitlementsPlist, withXcodeProject } = configPlugins;
const PLACEHOLDER_PASS_TYPE_IDS = ['$(TeamIdentifierPrefix)pass.example.placeholder'];

/**
 * Add PassKit entitlement (P2, P3).
 */
const withPassKitEntitlement: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, (cfg) => {
    const key = 'com.apple.developer.pass-type-identifiers';

    // P3: Preserve existing Pass Type IDs
    if (cfg.modResults[key] === undefined) {
      // P2: Add placeholder only when absent
      cfg.modResults[key] = PLACEHOLDER_PASS_TYPE_IDS;
    }

    return cfg;
  });
};

/**
 * Link PassKit.framework (P4).
 */
const withPassKitFramework: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const frameworkName = 'PassKit.framework';

    // Locate the iOS application target. Prefer an explicit lookup by product
    // type so we don't accidentally attach to a widget / share extension if the
    // ordering of native targets ever changes; fall back to the first native
    // target for safety.
    const target =
      project.getTarget('com.apple.product-type.application') ?? project.getFirstTarget();
    if (!target) return cfg;

    // `addFramework` from the `xcode` package is idempotent: it short-circuits
    // via `hasFile(file.path)` when the framework is already present in the
    // project, so calling it on every prebuild is safe.
    project.addFramework(frameworkName, { target: target.uuid });

    return cfg;
  });
};

/**
 * Compose all PassKit plugin mods.
 * Contract: P1, P5
 */
const withPassKit: ConfigPlugin = (config) => {
  let next = config;
  next = withPassKitEntitlement(next);
  next = withPassKitFramework(next);
  return next;
};

export default withPassKit;
