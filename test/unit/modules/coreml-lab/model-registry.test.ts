/**
 * Model registry tests for CoreML Lab (feature 016).
 */

import { MODEL_REGISTRY } from '@/modules/coreml-lab/model-registry';

describe('MODEL_REGISTRY', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(MODEL_REGISTRY)).toBe(true);
    expect(MODEL_REGISTRY.length).toBeGreaterThan(0);
  });

  it('every ModelDescriptor has required fields', () => {
    MODEL_REGISTRY.forEach((model) => {
      expect(model.name).toBeDefined();
      expect(model.displayName).toBeDefined();
      expect(model.resourceName).toBeDefined();
    });
  });

  it('MobileNetV2 entry exists', () => {
    const mobilenet = MODEL_REGISTRY.find((m) => m.name === 'MobileNetV2');
    expect(mobilenet).toBeDefined();
    expect(mobilenet?.displayName).toBe('MobileNetV2');
  });
});
