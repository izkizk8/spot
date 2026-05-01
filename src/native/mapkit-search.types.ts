// MapKit search bridge types

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
  searchLocations(query: string, region: SearchRegion): Promise<SearchResult[]>;
}

export class MapKitNotSupportedError extends Error {
  constructor(api: string) {
    super(`${api} is not supported on this platform`);
    this.name = 'MapKitNotSupportedError';
  }
}
