import { requireOptionalNativeModule } from 'expo-modules-core';
import {
  MapKitNotSupportedError,
  type MapKitSearchBridge,
  type SearchRegion,
  type SearchResult,
} from './mapkit-search.types';

interface SpotMapKitSearchModule {
  search(query: string, region: SearchRegion): Promise<SearchResult[]>;
}

const native = requireOptionalNativeModule<SpotMapKitSearchModule>('SpotMapKitSearch');

const bridge: MapKitSearchBridge = {
  async searchLocations(query, region) {
    if (!native) {
      throw new MapKitNotSupportedError('searchLocations');
    }
    return native.search(query, region);
  },
};

export default bridge;
