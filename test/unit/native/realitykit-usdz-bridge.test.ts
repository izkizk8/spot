/**
 * Bridge contract tests for RealityKit USDZ (feature 062).
 *
 * Tests the Android and Web bridge variants reject correctly.
 * The iOS bridge requires the native module to be present (tested
 * via the hook's test seam).
 */
describe('RealityKit USDZ Bridge', () => {
  describe('Android variant', () => {
    it('getCapabilities rejects with RealityKitUsdzNotSupported', async () => {
      const bridge = require('@/native/realitykit-usdz.android').default;
      await expect(bridge.getCapabilities()).rejects.toThrow(
        'RealityKit USDZ is not available on Android',
      );
    });

    it('previewModel rejects with RealityKitUsdzNotSupported', async () => {
      const bridge = require('@/native/realitykit-usdz.android').default;
      await expect(bridge.previewModel('toy_drummer')).rejects.toThrow(
        'RealityKit USDZ is not available on Android',
      );
    });

    it('exports RealityKitUsdzNotSupported error class', () => {
      const { RealityKitUsdzNotSupported } = require('@/native/realitykit-usdz.android');
      const err = new RealityKitUsdzNotSupported('test');
      expect(err.name).toBe('RealityKitUsdzNotSupported');
    });
  });

  describe('Web variant', () => {
    it('getCapabilities rejects with RealityKitUsdzNotSupported', async () => {
      const bridge = require('@/native/realitykit-usdz.web').default;
      await expect(bridge.getCapabilities()).rejects.toThrow(
        'RealityKit USDZ is not supported on web',
      );
    });

    it('previewModel rejects with RealityKitUsdzNotSupported', async () => {
      const bridge = require('@/native/realitykit-usdz.web').default;
      await expect(bridge.previewModel('toy_biplane')).rejects.toThrow(
        'RealityKit USDZ is not supported on web',
      );
    });

    it('exports RealityKitUsdzNotSupported error class', () => {
      const { RealityKitUsdzNotSupported } = require('@/native/realitykit-usdz.web');
      const err = new RealityKitUsdzNotSupported('test');
      expect(err.name).toBe('RealityKitUsdzNotSupported');
    });
  });
});
