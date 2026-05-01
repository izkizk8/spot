# Contract: `MapKitSearchBridge`

## Swift module name (Expo Modules API)

`SpotMapKitSearch` — registered in
`native/ios/mapkit/expo-module.config.json` and resolved on the JS
side via
`requireOptionalNativeModule<SpotMapKitSearchModule>('SpotMapKitSearch')`.

## Swift surface

```swift
public class MapKitSearchBridge: Module {
  public func definition() -> ModuleDefinition {
    Name("SpotMapKitSearch")

    AsyncFunction("search") {
      (query: String, region: SearchRegionInput) -> [SearchResult] in
      try await self.search(query: query, region: region)
    }
  }
}

struct SearchRegionInput: Record {
  @Field var lat: Double
  @Field var lng: Double
  @Field var latDelta: Double
  @Field var lngDelta: Double
}

struct SearchResult: Record {
  @Field var name: String
  @Field var address: String
  @Field var lat: Double
  @Field var lng: Double
}
```

Implementation behavior:

1. Build `MKLocalSearch.Request()`; set `naturalLanguageQuery =
   query`; set `region = MKCoordinateRegion(center:
   CLLocationCoordinate2D(latitude: region.lat, longitude:
   region.lng), span: MKCoordinateSpan(latitudeDelta:
   region.latDelta, longitudeDelta: region.lngDelta))`.
2. `let response = try await MKLocalSearch(request: request).start()`.
3. Map `response.mapItems` to `[SearchResult]`:
   - `name = item.name ?? ""`.
   - `address` joined from
     `[placemark.thoroughfare, locality, administrativeArea,
     country]` filter-non-nil + `joined(separator: ", ")`.
   - `lat = item.placemark.coordinate.latitude`.
   - `lng = item.placemark.coordinate.longitude`.
4. Empty `mapItems` returns `[]`.
5. Throws (network, MapKit error) propagate to JS as `Error`.

## JS surface

```ts
// src/native/mapkit-search.types.ts
export interface SearchResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SearchRegion {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}

export interface MapKitSearchBridge {
  searchLocations(query: string, region: SearchRegion):
    Promise<SearchResult[]>;
}

export class MapKitNotSupportedError extends Error {
  constructor(api: string) {
    super(`${api} is not supported on this platform`);
    this.name = 'MapKitNotSupportedError';
  }
}
```

### `mapkit-search.ios.ts`

```ts
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

const native = requireOptionalNativeModule<SpotMapKitSearchModule>(
  'SpotMapKitSearch',
);

const bridge: MapKitSearchBridge = {
  async searchLocations(query, region) {
    if (!native) {
      throw new MapKitNotSupportedError('searchLocations');
    }
    return native.search(query, region);
  },
};

export default bridge;
```

### `mapkit-search.android.ts` and `mapkit-search.web.ts`

```ts
import {
  MapKitNotSupportedError,
  type MapKitSearchBridge,
} from './mapkit-search.types';

const bridge: MapKitSearchBridge = {
  searchLocations: async () => {
    throw new MapKitNotSupportedError('searchLocations');
  },
};

export default bridge;
```

## Test contract

| Test                                  | Asserts                                                              |
|---------------------------------------|----------------------------------------------------------------------|
| `mapkit-search.ios.test.ts`           | Forwards `(query, region)` to mock; returns the array; throws when mock returns null. |
| `mapkit-search.android.test.ts`       | Always throws `MapKitNotSupportedError`.                             |
| `mapkit-search.web.test.ts`           | Always throws `MapKitNotSupportedError`.                             |
| `components/SearchPanel.test.tsx`     | Surfaces the array as a list; surfaces `error.message` inline; empty results render empty-state copy. |
