/**
 * Visual Look Up Bridge — Web stub (feature 060).
 *
 * Visual Look Up is iOS-only. All methods reject with
 * `VisualLookUpNotSupported`.
 */

import {
  VisualLookUpNotSupported,
  type AnalysisResult,
  type VisualLookUpBridge,
} from './visual-look-up.types';

export { VisualLookUpNotSupported };

const ERR = (): VisualLookUpNotSupported =>
  new VisualLookUpNotSupported('Visual Look Up is not supported on web');

export function isSupported(): Promise<boolean> {
  return Promise.reject(ERR());
}

export function analyzeImage(_imageUri: string): Promise<AnalysisResult> {
  return Promise.reject(ERR());
}

export const visualLookUp: VisualLookUpBridge = {
  isSupported,
  analyzeImage,
};

export default visualLookUp;
