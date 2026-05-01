import bridge from '@/native/mapkit-search.web';
import { MapKitNotSupportedError } from '@/native/mapkit-search.types';

describe('mapkit-search.web', () => {
  it('always throws MapKitNotSupportedError', async () => {
    await expect(
      bridge.searchLocations('test', { lat: 0, lng: 0, latDelta: 0.1, lngDelta: 0.1 }),
    ).rejects.toThrow(MapKitNotSupportedError);

    await expect(
      bridge.searchLocations('test', { lat: 0, lng: 0, latDelta: 0.1, lngDelta: 0.1 }),
    ).rejects.toThrow('searchLocations is not supported on this platform');
  });
});
