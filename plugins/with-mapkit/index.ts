import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withInfoPlist } = configPlugins;
const KEY = 'NSLocationWhenInUseUsageDescription';
const COPY =
  'Spot uses your location to center the MapKit Lab map on you and to drop pins at your current position.';

const withMapKit: ConfigPlugin = (config) => {
  return withInfoPlist(config, (mod) => {
    if (mod.modResults[KEY] !== COPY) {
      mod.modResults[KEY] = COPY;
    }
    return mod;
  });
};

export default withMapKit;
