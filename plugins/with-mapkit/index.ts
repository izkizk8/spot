import type { ConfigPlugin } from '@expo/config-plugins';
import { withInfoPlist } from '@expo/config-plugins';

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
