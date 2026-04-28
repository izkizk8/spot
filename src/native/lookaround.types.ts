// LookAround bridge types
import { MapKitNotSupportedError } from './mapkit-search.types';

export interface LookAroundResult {
  shown: boolean;
}

export interface LookAroundBridge {
  presentLookAround(lat: number, lng: number): Promise<LookAroundResult>;
}

export { MapKitNotSupportedError };
