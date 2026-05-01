import { requireOptionalNativeModule } from 'expo-modules-core';
import { type LookAroundBridge, type LookAroundResult } from './lookaround.types';
import { MapKitNotSupportedError } from './mapkit-search.types';

interface SpotLookAroundModule {
  presentLookAround(lat: number, lng: number): Promise<LookAroundResult>;
}

const native = requireOptionalNativeModule<SpotLookAroundModule>('SpotLookAround');

const bridge: LookAroundBridge = {
  async presentLookAround(lat, lng) {
    if (!native) {
      throw new MapKitNotSupportedError('presentLookAround');
    }
    return native.presentLookAround(lat, lng);
  },
};

export default bridge;
