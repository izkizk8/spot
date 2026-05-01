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

    // Find the main target
    const targets = project.getTargetsByType('application');
    if (targets.length === 0) return cfg;

    const mainTarget = targets[0];
    const frameworksBuildPhase = project.getTargetAttribute(
      'PBXFrameworksBuildPhase',
      mainTarget.uuid,
    );

    if (!frameworksBuildPhase) return cfg;

    // Check if PassKit.framework is already linked
    const files = project.pbxFrameworksBuildPhaseObj(frameworksBuildPhase)['files'] || [];
    const isLinked = files.some((file: any) => {
      const fileRef = project.pbxFileReferenceSection()[file.value];
      return fileRef && fileRef.name === frameworkName;
    });

    if (!isLinked) {
      // Add PassKit.framework
      project.addFramework(frameworkName, { target: mainTarget.uuid });
    }

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
