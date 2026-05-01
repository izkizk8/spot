import bridge from '@/native/mapkit-search';
import type { SearchRegion } from '@/native/mapkit-search.types';
import {
  __setSearchModule,
  __setSearchResult,
  __resetSearchMock,
} from '@test/__mocks__/native-mapkit-search';

describe('mapkit-search.ios', () => {
  beforeEach(() => {
    __resetSearchMock();
  });

  it('forwards query and region to native module and returns results', async () => {
    const mockResults = [
      { name: 'Coffee Shop', address: '123 Main St, SF, CA, USA', lat: 37.7749, lng: -122.4194 },
      { name: 'Cafe', address: '456 Market St, SF, CA, USA', lat: 37.7849, lng: -122.4094 },
    ];

    __setSearchResult(mockResults);

    const query = 'coffee';
    const region: SearchRegion = { lat: 37.7749, lng: -122.4194, latDelta: 0.1, lngDelta: 0.1 };

    const results = await bridge.searchLocations(query, region);

    expect(results).toEqual(mockResults);
  });

  it('returns empty array when no results found', async () => {
    __setSearchResult([]);

    const results = await bridge.searchLocations('nonexistent', {
      lat: 0,
      lng: 0,
      latDelta: 0.1,
      lngDelta: 0.1,
    });

    expect(results).toEqual([]);
  });
});
