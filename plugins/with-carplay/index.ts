/**
 * with-carplay — Expo config plugin for feature 045.
 *
 * Educational scaffold-level plugin. CarPlay scenes require:
 *
 *   - the Apple-issued CarPlay entitlement
 *     (e.g. `com.apple.developer.carplay-audio` for the Audio
 *     category) on the parent target's entitlements plist; and
 *   - a `UISceneManifest` entry in Info.plist declaring a
 *     `CPTemplateApplicationSceneSessionRoleApplication` scene with
 *     a delegate class.
 *
 * This plugin sets BOTH (additively, idempotently). The boolean
 * placeholder entitlement makes the build *valid* even before Apple
 * issues the real entitlement, so the parent target keeps signing
 * cleanly. The UISceneManifest entry is appended only if no
 * configuration already exists for the CarPlay role.
 *
 * Pure helpers `applyCarPlayEntitlement` and `applyCarPlaySceneManifest`
 * are exported so unit tests can assert byte-identical idempotency
 * without driving the full mod runner.
 */

import type { ConfigPlugin } from '@expo/config-plugins';
import { withEntitlementsPlist, withInfoPlist } from '@expo/config-plugins';

import { CARPLAY_SCENE_ROLE } from '../../src/native/carplay.types';

export const CARPLAY_AUDIO_ENTITLEMENT_KEY = 'com.apple.developer.carplay-audio' as const;

export const CARPLAY_SCENE_DELEGATE_CLASS = 'CarPlaySceneDelegate' as const;
export const CARPLAY_SCENE_CLASS = 'CPTemplateApplicationScene' as const;
export const CARPLAY_CONFIGURATION_NAME = 'Default Configuration' as const;

interface SceneConfigurationEntry {
  readonly UISceneClassName: string;
  readonly UISceneConfigurationName: string;
  readonly UISceneDelegateClassName: string;
}

/**
 * Pure mutation: returns a new entitlements record with the CarPlay
 * audio placeholder boolean entitlement set to `true`. Any prior
 * non-boolean value is replaced with a one-time `console.warn`. A
 * pre-existing boolean (whether true or false) is preserved.
 */
export function applyCarPlayEntitlement(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const prior = next[CARPLAY_AUDIO_ENTITLEMENT_KEY];

  if (typeof prior === 'boolean') {
    return next;
  }
  if (prior !== undefined) {
    console.warn(`with-carplay: ${CARPLAY_AUDIO_ENTITLEMENT_KEY} was not a boolean; replacing.`);
  }
  next[CARPLAY_AUDIO_ENTITLEMENT_KEY] = true;
  return next;
}

/**
 * Pure mutation: ensures `UIApplicationSceneManifest.UISceneConfigurations`
 * carries a `CPTemplateApplicationSceneSessionRoleApplication` array
 * with at least one entry pointing at our delegate class. Existing
 * entries are preserved verbatim. The function is byte-stable across
 * repeated runs.
 */
export function applyCarPlaySceneManifest(input: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...input };
  const manifest =
    typeof next.UIApplicationSceneManifest === 'object' && next.UIApplicationSceneManifest !== null
      ? { ...(next.UIApplicationSceneManifest as Record<string, unknown>) }
      : {};

  const configurations =
    typeof manifest.UISceneConfigurations === 'object' && manifest.UISceneConfigurations !== null
      ? { ...(manifest.UISceneConfigurations as Record<string, unknown>) }
      : {};

  const existing = configurations[CARPLAY_SCENE_ROLE];
  const carplayEntries: SceneConfigurationEntry[] = Array.isArray(existing)
    ? (existing as SceneConfigurationEntry[])
    : [];

  const hasOurEntry = carplayEntries.some(
    (entry) =>
      entry &&
      entry.UISceneDelegateClassName === CARPLAY_SCENE_DELEGATE_CLASS &&
      entry.UISceneClassName === CARPLAY_SCENE_CLASS,
  );

  const nextEntries: SceneConfigurationEntry[] = hasOurEntry
    ? carplayEntries
    : [
        ...carplayEntries,
        {
          UISceneClassName: CARPLAY_SCENE_CLASS,
          UISceneConfigurationName: CARPLAY_CONFIGURATION_NAME,
          UISceneDelegateClassName: CARPLAY_SCENE_DELEGATE_CLASS,
        },
      ];

  configurations[CARPLAY_SCENE_ROLE] = nextEntries;
  manifest.UISceneConfigurations = configurations;
  next.UIApplicationSceneManifest = manifest;
  return next;
}

const withCarPlay: ConfigPlugin = (config) => {
  const withEntitlement = withEntitlementsPlist(config, (mod) => {
    mod.modResults = applyCarPlayEntitlement(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });

  return withInfoPlist(withEntitlement, (mod) => {
    mod.modResults = applyCarPlaySceneManifest(
      mod.modResults as unknown as Record<string, unknown>,
    ) as typeof mod.modResults;
    return mod;
  });
};

export default withCarPlay;
