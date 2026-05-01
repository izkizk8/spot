/**
 * Vision detector bridge — iOS implementation.
 *
 * Uses requireOptionalNativeModule('Vision') to access the native Swift module.
 * isAvailable() checks Platform.OS === 'ios' && nativeModule != null.
 * analyze(mode, payload) validates InvalidInput cases before delegating to native.
 *
 * @see specs/017-camera-vision/contracts/vision-bridge.contract.ts
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  VisionBridge,
  ActiveVisionMode,
  AnalyzePayload,
  AnalysisResult,
} from './vision-detector.types';
import { VisionNotSupported, InvalidInput } from './vision-detector.types';

// Attempt to load the optional native module
const nativeModule = requireOptionalNativeModule('Vision');

/**
 * Synchronous capability check. Returns true only on iOS when the native
 * module is registered.
 */
export function isAvailable(): boolean {
  return Platform.OS === 'ios' && nativeModule != null;
}

/**
 * Runs Vision analysis on the given image.
 *
 * Validates payload contract (exactly one of base64 or uri must be present).
 * Rejects with VisionNotSupported if not on iOS or native module absent.
 * Rejects with InvalidInput if payload contract is violated.
 * Delegates to native module's async analyze function.
 */
export async function analyze(
  mode: ActiveVisionMode,
  payload: AnalyzePayload,
): Promise<AnalysisResult> {
  // Check availability
  if (!isAvailable()) {
    throw new VisionNotSupported('Vision is not available on this platform.');
  }

  // Validate payload contract: exactly one of base64 or uri must be present
  const hasBase64 = payload.base64 != null;
  const hasUri = payload.uri != null;

  if (hasBase64 && hasUri) {
    throw new InvalidInput('Invalid bridge input: both base64 and uri are present.');
  }

  if (!hasBase64 && !hasUri) {
    throw new InvalidInput('Invalid bridge input: neither base64 nor uri is present.');
  }

  // Delegate to native module
  // The native module is typed to return the correct shape
  return await nativeModule!.analyze(mode, payload);
}

// Export the bridge shape for type checking
const bridge: VisionBridge = {
  isAvailable,
  analyze,
};

export default bridge;
