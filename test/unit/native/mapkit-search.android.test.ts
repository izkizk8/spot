import bridge from '@/native/mapkit-search.android';
import { MapKitNotSupportedError } from '@/native/mapkit-search.types';

describe('mapkit-search.android', () => {
  it('always throws MapKitNotSupportedError', async () => {
    await expect(
      bridge.searchLocations('test', { lat: 0, lng: 0, latDelta: 0.1, lngDelta: 0.1 }),
    ).rejects.toThrow(MapKitNotSupportedError);

    await expect(
      bridge.searchLocations('test', { lat: 0, lng: 0, latDelta: 0.1, lngDelta: 0.1 }),
    ).rejects.toThrow('searchLocations is not supported on this platform');
  });
});
