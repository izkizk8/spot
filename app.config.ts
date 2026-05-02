import type { ConfigContext, ExpoConfig } from 'expo/config';

const SIDELOAD_DEV_PROFILE = 'sideload-dev';

export default ({ config }: ConfigContext): ExpoConfig => {
  const buildProfile = process.env.EAS_BUILD_PROFILE;

  if (buildProfile !== SIDELOAD_DEV_PROFILE) {
    return config as ExpoConfig;
  }

  // For free-tier sideload signing the IPA cannot satisfy privileged
  // entitlements (FamilyControls, HealthKit, HomeKit, WeatherKit, Apple
  // Pay, PassKit, CarPlay, iCloud, App Clips, ...) and embedded app
  // extension targets cannot be re-signed. Either situation crashes the
  // host process before expo-dev-client's launcher window can present,
  // producing a black screen on launch. The 'sideload-dev' EAS profile
  // exists purely to debug on-device JS issues, so we strip every local
  // ./plugins/with-* entry plus 'associatedDomains' to guarantee the
  // launcher comes up. The full app JS can then be served over Metro
  // (pnpm start --dev-client --tunnel) for live diagnostics.
  //
  // Native modules from npm dependencies (expo-camera, expo-location,
  // ...) remain auto-linked, so most JS still works; only APIs that
  // require the stripped entitlements throw at call time.
  const filteredPlugins = (config.plugins ?? []).filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return typeof name !== 'string' || !name.startsWith('./plugins/with-');
  });

  const { associatedDomains: _associatedDomains, ...iosConfig } = config.ios ?? {};

  return {
    ...config,
    ios: iosConfig,
    plugins: filteredPlugins,
  } as ExpoConfig;
};
