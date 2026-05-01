export interface Landmark {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export const LANDMARKS: readonly Landmark[] = [
  {
    id: 'apple-park',
    name: 'Apple Park',
    lat: 37.3349,
    lng: -122.009,
    description: 'Apple headquarters in Cupertino, California',
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    lat: 48.8584,
    lng: 2.2945,
    description: 'Iconic iron lattice tower in Paris, France',
  },
  {
    id: 'tokyo-tower',
    name: 'Tokyo Tower',
    lat: 35.6586,
    lng: 139.7454,
    description: 'Communications and observation tower in Tokyo, Japan',
  },
  {
    id: 'sydney-opera-house',
    name: 'Sydney Opera House',
    lat: -33.8568,
    lng: 151.2153,
    description: 'Multi-venue performing arts center in Sydney, Australia',
  },
];

export interface Region {
  lat: number;
  lng: number;
  latDelta: number;
  lngDelta: number;
}

export const DEFAULT_FALLBACK_REGION: Region = {
  lat: 39.5,
  lng: -98.35,
  latDelta: 35,
  lngDelta: 50,
};
