/**
 * Tests for widget-center bridge extensions (028 additions)
 *
 * Covers getStandByConfig / setStandByConfig across:
 *  - Web platform (rejects with WidgetCenterNotSupportedError)
 *  - Android platform (rejects with WidgetCenterNotSupportedError)
 *  - iOS 17+ with native module mocked (call-through + error mapping
 *    + defensive validation of unknown mode)
 *  - iOS < 17 (rejects with WidgetCenterNotSupportedError)
 *  - reuse of 027's reloadTimelinesByKind('SpotStandByWidget')
 *  - 014 / 027 regression
 *  - static check: no `reloadStandByTimelines` symbol exists in bridge files
 *
 * @see specs/028-standby-mode/tasks.md T009
 * @see specs/028-standby-mode/contracts/widget-center-bridge.contract.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const mockNativeModule = {
  isAvailable: jest.fn(),
  getCurrentConfig: jest.fn(),
  setConfig: jest.fn(),
  reloadAllTimelines: jest.fn(),
  reloadTimelinesByKind: jest.fn(),
  getLockConfig: jest.fn(),
  setLockConfig: jest.fn(),
  getStandByConfig: jest.fn(),
  setStandByConfig: jest.fn(),
};

jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: jest.fn(() => mockNativeModule),
}));

const STANDBY_FIXTURE = {
  showcaseValue: 'StandBy',
  counter: 0,
  tint: 'blue' as const,
  mode: 'fullColor' as const,
};

describe('widget-center bridge (028 additions)', () => {
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

    it('getStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getStandByConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.setStandByConfig(STANDBY_FIXTURE)).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
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

    it('getStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getStandByConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.setStandByConfig(STANDBY_FIXTURE)).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('isAvailable returns false', () => {
      const bridge = require('@/native/widget-center').default;
      expect(bridge.isAvailable()).toBe(false);
    });
  });

  describe('iOS 17+ with native module mocked', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '17.0' },
      }));
      mockNativeModule.getStandByConfig.mockResolvedValue(STANDBY_FIXTURE);
      mockNativeModule.setStandByConfig.mockResolvedValue(undefined);
      mockNativeModule.reloadTimelinesByKind.mockResolvedValue(undefined);
    });

    it('getStandByConfig resolves with mocked module response (all 4 fields round-trip)', async () => {
      const bridge = require('@/native/widget-center').default;
      const result = await bridge.getStandByConfig();
      expect(result).toEqual(STANDBY_FIXTURE);
      expect(result.mode).toBe('fullColor');
    });

    it('setStandByConfig calls through with the same payload', async () => {
      const bridge = require('@/native/widget-center').default;
      const cfg = {
        showcaseValue: 'X',
        counter: 5,
        tint: 'green' as const,
        mode: 'accented' as const,
      };
      await bridge.setStandByConfig(cfg);
      expect(mockNativeModule.setStandByConfig).toHaveBeenCalledWith(cfg);
    });

    it('reloadTimelinesByKind("SpotStandByWidget") calls through with exact kind string', async () => {
      const bridge = require('@/native/widget-center').default;
      await bridge.reloadTimelinesByKind('SpotStandByWidget');
      expect(mockNativeModule.reloadTimelinesByKind).toHaveBeenCalledWith('SpotStandByWidget');
    });

    it('native rejection NOT_SUPPORTED → WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      const err: any = new Error('Not supported');
      err.code = 'NOT_SUPPORTED';
      mockNativeModule.getStandByConfig.mockRejectedValueOnce(err);
      await expect(bridge.getStandByConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('native rejection any other code → WidgetCenterBridgeError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterBridgeError } = require('@/native/widget-center.types');
      const err: any = new Error('Boom');
      err.code = 'OTHER';
      mockNativeModule.setStandByConfig.mockRejectedValueOnce(err);
      await expect(bridge.setStandByConfig(STANDBY_FIXTURE)).rejects.toThrow(
        WidgetCenterBridgeError,
      );
    });

    it('setStandByConfig with unknown mode rejects with WidgetCenterBridgeError (defensive)', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterBridgeError } = require('@/native/widget-center.types');
      const bad = { showcaseValue: 'X', counter: 0, tint: 'blue', mode: 'unknown' };
      await expect(bridge.setStandByConfig(bad)).rejects.toThrow(WidgetCenterBridgeError);
      expect(mockNativeModule.setStandByConfig).not.toHaveBeenCalled();
    });
  });

  describe('iOS < 17', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '16.4' },
      }));
    });

    it('getStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.getStandByConfig()).rejects.toThrow(WidgetCenterNotSupportedError);
    });

    it('setStandByConfig rejects with WidgetCenterNotSupportedError', async () => {
      const bridge = require('@/native/widget-center').default;
      const { WidgetCenterNotSupportedError } = require('@/native/widget-center.types');
      await expect(bridge.setStandByConfig(STANDBY_FIXTURE)).rejects.toThrow(
        WidgetCenterNotSupportedError,
      );
    });

    it('isAvailable returns true (014 still works on iOS 16+)', () => {
      const bridge = require('@/native/widget-center').default;
      expect(bridge.isAvailable()).toBe(true);
    });
  });

  describe('static check: no reloadStandByTimelines symbol exists (FR-SB-024)', () => {
    const bridgeFiles = [
      'src/native/widget-center.ts',
      'src/native/widget-center.android.ts',
      'src/native/widget-center.web.ts',
      'src/native/widget-center.types.ts',
    ];

    bridgeFiles.forEach((relPath) => {
      it(`${relPath} contains no 'reloadStandByTimelines' symbol`, () => {
        const abs = path.join(__dirname, '..', '..', '..', relPath);
        const src = fs.readFileSync(abs, 'utf8');
        expect(src.includes('reloadStandByTimelines')).toBe(false);
      });
    });
  });

  describe('014 / 027 regression', () => {
    beforeEach(() => {
      jest.doMock('react-native', () => ({
        Platform: { OS: 'ios', Version: '17.0' },
      }));
      mockNativeModule.getCurrentConfig.mockResolvedValue({
        showcaseValue: 'Hi',
        counter: 0,
        tint: 'blue',
      });
      mockNativeModule.setConfig.mockResolvedValue(undefined);
      mockNativeModule.reloadAllTimelines.mockResolvedValue(undefined);
      mockNativeModule.getLockConfig.mockResolvedValue({
        showcaseValue: 'Hello, Lock!',
        counter: 0,
        tint: 'blue',
      });
      mockNativeModule.setLockConfig.mockResolvedValue(undefined);
    });

    it('every existing bridge method is still defined and callable', async () => {
      const bridge = require('@/native/widget-center').default;
      expect(typeof bridge.getCurrentConfig).toBe('function');
      expect(typeof bridge.setConfig).toBe('function');
      expect(typeof bridge.reloadAllTimelines).toBe('function');
      expect(typeof bridge.reloadTimelinesByKind).toBe('function');
      expect(typeof bridge.getLockConfig).toBe('function');
      expect(typeof bridge.setLockConfig).toBe('function');
      expect(typeof bridge.isAvailable).toBe('function');
      await expect(bridge.getCurrentConfig()).resolves.toBeDefined();
      await expect(bridge.getLockConfig()).resolves.toBeDefined();
    });
  });
});
