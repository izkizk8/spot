import { MapKitNotSupportedError, type MapKitSearchBridge } from './mapkit-search.types';

const bridge: MapKitSearchBridge = {
  searchLocations: async () => {
    throw new MapKitNotSupportedError('searchLocations');
  },
};

export default bridge;
