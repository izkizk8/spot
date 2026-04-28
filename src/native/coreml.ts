/**
 * iOS JS bridge for CoreML / Vision (feature 016).
 *
 * Mirrors the precedent set by feature 015's `screentime.ts` and
 * feature 014's `widget-center.ts`.
 *
 * Routing rules:
 *   - `isAvailable()` is synchronous; returns `false` when the optional
 *     native module is absent or on non-iOS platforms.
 *   - Every async method rejects with `CoreMLNotSupportedError` when
 *     `native === null`.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type { ClassifyResult, CoreMLBridge, LoadModelResult } from './coreml.types';
import { CoreMLNotSupportedError } from './coreml.types';

interface NativeCoreML {
  loadModel(name: string): Promise<LoadModelResult>;
  classify(imageBase64: string): Promise<ClassifyResult>;
}

const native = requireOptionalNativeModule<NativeCoreML>('SpotCoreML');

async function requireNative(): Promise<NativeCoreML> {
  if (native === null) {
    throw new CoreMLNotSupportedError();
  }
  return native;
}

const bridge: CoreMLBridge = {
  isAvailable(): boolean {
    return Platform.OS === 'ios' && native !== null;
  },
  async loadModel(name: string): Promise<LoadModelResult> {
    const m = await requireNative();
    return m.loadModel(name);
  },
  async classify(imageBase64: string): Promise<ClassifyResult> {
    const m = await requireNative();
    return m.classify(imageBase64);
  },
};

export default bridge;
