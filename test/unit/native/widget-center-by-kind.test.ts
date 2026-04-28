/**
 * Tests for widget-center bridge extensions (027 additions)
 *
 * Covers reloadTimelinesByKind, getLockConfig, setLockConfig across:
 *  - Web platform (all reject with WidgetCenterNotSupportedError)
 *  - Android platform (all reject with WidgetCenterNotSupportedError)
 *  - iOS 16+ with native module mocked (call-through + error mapping)
 *  - iOS < 16 (rejects with WidgetCenterNotSupportedError)
 *  - 014 regression (existing getCurrentConfig/setConfig/reloadAllTimelines still work)
 *
 * @see specs/027-lock-screen-widgets/tasks.md T013
 * @see specs/027-lock-screen-widgets/contracts/widget-center-bridge.contract.ts
 */

const mockNativeModule = {
  isAvailable: jest.fn(),
  getCurrentConfig: jest.fn(),
  setConfig: jest.fn(),
  reloadAllTimelines: jest.fn(),
  reloadTimelinesByKind: jest.fn(),
  getLockConfig: jest.fn(),
  setLockConfig: jest.fn(),
};

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(() => mockNativeModule),
}));

describe('widget-center bridge (027 additions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockNativeModule.isAvailable.mockReturnValue(true);
  });

  describe('web platform', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'web', Version: 0 },
      }));
    });

    it('reloadTimelinesByKind rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.reloadTimelinesByKind('SpotLockScreenWidget')).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('getLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getLockConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      const config = { showcaseValue: 'Test', counter: 0, tint: 'blue' };
      await expect(bridge.setLockConfig(config)).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('isAvailable returns false and does not throw', () => {
      const bridge = require('@/native/widget-center').default;
      expect(bridge.isAvailable()).toBe(false);
    });
  });

  describe('android platform', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'android', Version: 33 },
      }));
    });

    it('reloadTimelinesByKind rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.reloadTimelinesByKind('SpotLockScreenWidget')).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('getLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getLockConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      const config = { showcaseValue: 'Test', counter: 0, tint: 'blue' };
      await expect(bridge.setLockConfig(config)).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('isAvailable returns false and does not throw', () => {
      const bridge = require('@/native/widget-center').default;
      expect(bridge.isAvailable()).toBe(false);
    });
  });

  describe('iOS 16+ with native module mocked', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '16.0' },
      }));
      mockNativeModule.reloadTimelinesByKind.mockResolvedValue(undefined);
      mockNativeModule.getLockConfig.mockResolvedValue({
        showcaseValue: 'Hello, Lock!',
        counter: 0,
        tint: 'blue',
      });
      mockNativeModule.setLockConfig.mockResolvedValue(undefined);
    });

    it('reloadTimelinesByKind calls native module with exact kind string', async () => {
      const bridge = require('@/native/widget-center').default;
      await bridge.reloadTimelinesByKind('SpotLockScreenWidget');
      expect(mockNativeModule.reloadTimelinesByKind).toHaveBeenCalledWith('SpotLockScreenWidget');
    });

    it('getLockConfig resolves with mocked module response', async () => {
      const bridge = require('@/native/widget-center').default;
      const expected = { showcaseValue: 'Hello, Lock!', counter: 0, tint: 'blue' };
      const result = await bridge.getLockConfig();
      expect(result).toEqual(expected);
    });

    it('setLockConfig calls through with the same payload', async () => {
      const bridge = require('@/native/widget-center').default;
      const config = { showcaseValue: 'Test', counter: 42, tint: 'orange' };
      await bridge.setLockConfig(config);
      expect(mockNativeModule.setLockConfig).toHaveBeenCalledWith(config);
    });

    it('native rejection with code NOT_SUPPORTED surfaces as WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      const error: any = new Error('Not supported');
      error.code = 'NOT_SUPPORTED';
      mockNativeModule.reloadTimelinesByKind.mockRejectedValueOnce(error);
      await expect(bridge.reloadTimelinesByKind('SpotLockScreenWidget')).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('native rejection with any other code surfaces as WidgetCenterBridgeError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterBridgeError } = require('@/native/widget-center.types');
      const error: any = new Error('Some other error');
      error.code = 'OTHER_ERROR';
      mockNativeModule.reloadTimelinesByKind.mockRejectedValueOnce(error);
      await expect(bridge.reloadTimelinesByKind('SpotLockScreenWidget')).rejects.toThrow(
        WidgetCenterBridgeError,
      );
    });
  });

  describe('iOS < 16', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '15.0' },
      }));
    });

    it('reloadTimelinesByKind rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.reloadTimelinesByKind('SpotLockScreenWidget')).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('getLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getLockConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setLockConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      const config = { showcaseValue: 'Test', counter: 0, tint: 'blue' };
      await expect(bridge.setLockConfig(config)).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('isAvailable returns true (014 still works on iOS 15)', () => {
      const bridge = require('@/native/widget-center').default;
      expect(bridge.isAvailable()).toBe(true);
    });
  });

  describe('014 regression', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '16.0' },
      }));
      mockNativeModule.getCurrentConfig.mockResolvedValue({
        showcaseValue: 'Hello',
        counter: 0,
        tint: 'blue',
      });
      mockNativeModule.setConfig.mockResolvedValue(undefined);
      mockNativeModule.reloadAllTimelines.mockResolvedValue(undefined);
    });

    it('getCurrentConfig still resolves correctly', async () => {
      const bridge = require('@/native/widget-center').default;
      const result = await bridge.getCurrentConfig();
      expect(result).toBeDefined();
      expect(result.showcaseValue).toBe('Hello');
    });

    it('setConfig still resolves correctly', async () => {
      const bridge = require('@/native/widget-center').default;
      const config = { showcaseValue: 'Test', counter: 1, tint: 'green' };
      await expect(bridge.setConfig(config)).resolves.toBeUndefined();
      expect(mockNativeModule.setConfig).toHaveBeenCalled();
    });

    it('reloadAllTimelines still resolves correctly', async () => {
      const bridge = require('@/native/widget-center').default;
      await expect(bridge.reloadAllTimelines()).resolves.toBeUndefined();
      expect(mockNativeModule.reloadAllTimelines).toHaveBeenCalled();
    });

    it('isAvailable still returns correct value', () => {
      const bridge = require('@/native/widget-center').default;
      expect(typeof bridge.isAvailable()).toBe('boolean');
    });
  });
});
