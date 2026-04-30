/**
 * CoreImage Bridge — Web stub (feature 064).
 *
 * CoreImage is iOS-only. All methods reject with
 * `CoreImageNotSupported`.
 */
import {
  CoreImageNotSupported,
  type CICapabilities,
  type CoreImageBridge,
  type FilterId,
  type FilterParams,
  type FilterResult,
} from './core-image.types';

export { CoreImageNotSupported };

const ERR = (): CoreImageNotSupported =>
  new CoreImageNotSupported('CoreImage is not supported on web');

export function getCapabilities(): Promise<CICapabilities> {
  return Promise.reject(ERR());
}

export function applyFilter(_filterId: FilterId, _params: FilterParams): Promise<FilterResult> {
  return Promise.reject(ERR());
}

export const coreImage: CoreImageBridge = {
  getCapabilities,
  applyFilter,
};

export default coreImage;
