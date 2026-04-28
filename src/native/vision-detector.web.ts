/**
 * Vision detector bridge — Web stub.
 *
 * Vision is iOS-only. All methods return false or reject with VisionNotSupported.
 *
 * @see specs/017-camera-vision/contracts/vision-bridge.contract.ts
 */

import type {
  VisionBridge,
  ActiveVisionMode,
  AnalyzePayload,
  AnalysisResult,
} from './vision-detector.types';
import { VisionNotSupported } from './vision-detector.types';

/**
 * Always returns false on web.
 */
export function isAvailable(): boolean {
  return false;
}

/**
 * Always rejects with VisionNotSupported on web.
 */
export async function analyze(
  mode: ActiveVisionMode,
  payload: AnalyzePayload
): Promise<AnalysisResult> {
  throw new VisionNotSupported('Vision is not available on web.');
}

// Export the bridge shape for type checking
const bridge: VisionBridge = {
  isAvailable,
  analyze,
};

export default bridge;
