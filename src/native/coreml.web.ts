/**
 * Web stub for the CoreML bridge — same shape as the Android stub.
 */

import type { ClassifyResult, CoreMLBridge, LoadModelResult } from './coreml.types';
import { CoreMLNotSupportedError } from './coreml.types';

const bridge: CoreMLBridge = {
  isAvailable(): boolean {
    return false;
  },
  async loadModel(_name: string): Promise<LoadModelResult> {
    throw new CoreMLNotSupportedError();
  },
  async classify(_imageBase64: string): Promise<ClassifyResult> {
    throw new CoreMLNotSupportedError();
  },
};

export default bridge;
