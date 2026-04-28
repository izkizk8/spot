/**
 * Bridge contract tests for CoreML (feature 016).
 *
 * Tests the iOS, Android, and Web bridge variants.
 */

describe('CoreML Bridge', () => {
  describe('Android variant', () => {
    it('isAvailable returns false', () => {
      const bridge = require('@/native/coreml.android').default;
      expect(bridge.isAvailable()).toBe(false);
    });

    it('loadModel rejects with CoreMLNotSupportedError', async () => {
      const bridge = require('@/native/coreml.android').default;
      await expect(bridge.loadModel('test')).rejects.toThrow('CoreML is not available');
    });

    it('classify rejects with CoreMLNotSupportedError', async () => {
      const bridge = require('@/native/coreml.android').default;
      await expect(bridge.classify('base64')).rejects.toThrow('CoreML is not available');
    });
  });

  describe('Web variant', () => {
    it('isAvailable returns false', () => {
      const bridge = require('@/native/coreml.web').default;
      expect(bridge.isAvailable()).toBe(false);
    });

    it('loadModel rejects with CoreMLNotSupportedError', async () => {
      const bridge = require('@/native/coreml.web').default;
      await expect(bridge.loadModel('test')).rejects.toThrow('CoreML is not available');
    });

    it('classify rejects with CoreMLNotSupportedError', async () => {
      const bridge = require('@/native/coreml.web').default;
      await expect(bridge.classify('base64')).rejects.toThrow('CoreML is not available');
    });
  });
});
