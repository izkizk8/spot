import { type LookAroundBridge } from './lookaround.types';
import { MapKitNotSupportedError } from './mapkit-search.types';

const bridge: LookAroundBridge = {
  presentLookAround: async () => {
    throw new MapKitNotSupportedError('presentLookAround');
  },
};

export default bridge;
