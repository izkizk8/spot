/**
 * CarPlay bridge — Web variant (feature 045). All async methods
 * reject with `CarPlayNotSupported`; `isAvailable()` returns false.
 * MUST NOT import the iOS bridge file.
 */

import {
  type CarPlayBridge,
  type CarPlayStatus,
  type CarPlayTemplateKind,
  CarPlayNotSupported,
} from './carplay.types';

export { CarPlayNotSupported };

const ERR = new CarPlayNotSupported('CarPlay is not available on Web');

export function isAvailable(): boolean {
  return false;
}

export function getStatus(): Promise<CarPlayStatus> {
  return Promise.resolve('unsupported');
}

export function presentTemplate(_kind: CarPlayTemplateKind): Promise<void> {
  return Promise.reject(ERR);
}

export const carplay: CarPlayBridge = {
  isAvailable,
  getStatus,
  presentTemplate,
};

export default carplay;
