import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('widget-center bridge', () => {
  // We'll test different platforms by mocking the module imports
  // Each describe block tests a different platform scenario

  describe('web platform', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('isAvailable() should return false without throwing', () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'web' }));
      const bridge = require('@/native/widget-center.web').default;
      expect(bridge.isAvailable()).toBe(false);
    });

    it('getCurrentConfig() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'web' }));
      const bridge = require('@/native/widget-center.web').default;
      await expect(bridge.getCurrentConfig()).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.getCurrentConfig()).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });

    it('setConfig() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'web' }));
      const bridge = require('@/native/widget-center.web').default;
      const config = { showcaseValue: 'Test', counter: 0, tint: 'blue' as const };
      await expect(bridge.setConfig(config)).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.setConfig(config)).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });

    it('reloadAllTimelines() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'web' }));
      const bridge = require('@/native/widget-center.web').default;
      await expect(bridge.reloadAllTimelines()).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.reloadAllTimelines()).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });
  });

  describe('android platform', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('isAvailable() should return false without throwing', () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android' }));
      const bridge = require('@/native/widget-center.android').default;
      expect(bridge.isAvailable()).toBe(false);
    });

    it('getCurrentConfig() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android' }));
      const bridge = require('@/native/widget-center.android').default;
      await expect(bridge.getCurrentConfig()).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.getCurrentConfig()).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });

    it('setConfig() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android' }));
      const bridge = require('@/native/widget-center.android').default;
      const config = { showcaseValue: 'Test', counter: 0, tint: 'blue' as const };
      await expect(bridge.setConfig(config)).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.setConfig(config)).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });

    it('reloadAllTimelines() should reject with WidgetCenterNotSupportedError', async () => {
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({ OS: 'android' }));
      const bridge = require('@/native/widget-center.android').default;
      await expect(bridge.reloadAllTimelines()).rejects.toThrow('WidgetCenter is only available on iOS 14+');
      await expect(bridge.reloadAllTimelines()).rejects.toMatchObject({
        name: 'WidgetCenterNotSupportedError',
      });
    });
  });

  describe('iOS platform - basic module availability tests', () => {
    it('should test iOS native bridge through types file', () => {
      // The iOS bridge requires native module which we cannot fully test in Jest
      // We'll test the types and error classes are properly exported
      const { WidgetCenterNotSupportedError, WidgetCenterBridgeError } = require('@/native/widget-center.types');
      
      const notSupportedError = new WidgetCenterNotSupportedError();
      expect(notSupportedError.name).toBe('WidgetCenterNotSupportedError');
      expect(notSupportedError.message).toContain('iOS 14+');

      const bridgeError = new WidgetCenterBridgeError('test error');
      expect(bridgeError.name).toBe('WidgetCenterBridgeError');
      expect(bridgeError.message).toBe('test error');
    });
  });
});
