/**
 * RealityKit USDZ Bridge — Android stub (feature 062).
 *
 * RealityKit / AR Quick Look is iOS-only. All methods reject with
 * `RealityKitUsdzNotSupported`. MUST NOT import the iOS variant.
 */
import {
  RealityKitUsdzNotSupported,
  type ModelName,
  type RKCapabilities,
  type RealityKitUsdzBridge,
} from './realitykit-usdz.types';

export { RealityKitUsdzNotSupported };

const ERR = (): RealityKitUsdzNotSupported =>
  new RealityKitUsdzNotSupported('RealityKit USDZ is not available on Android');

export function getCapabilities(): Promise<RKCapabilities> {
  return Promise.reject(ERR());
}

export function previewModel(_modelName: ModelName): Promise<void> {
  return Promise.reject(ERR());
}

export const realityKitUsdz: RealityKitUsdzBridge = {
  getCapabilities,
  previewModel,
};

export default realityKitUsdz;
