/**
 * Tests for the Live Activity bridge contract.
 *
 * Covers:
 * - Non-iOS stub behavior (Android, Web)
 * - iOS bridge structural compliance with LiveActivityBridge interface
 * - Type-safe error classes
 *
 * @see specs/007-live-activities-dynamic-island/contracts/live-activity-bridge.md
 * @see specs/007-live-activities-dynamic-island/tasks.md T020
 */

import type { LiveActivityBridge } from '@/native/live-activity.types';
import {
  LiveActivityAlreadyRunningError,
  LiveActivityAuthorisationError,
  LiveActivityNoActiveSessionError,
  LiveActivityNotSupportedError,
} from '@/native/live-activity.types';

// Import the stubs directly for testing
// We use require to avoid Metro's platform-specific resolution
const androidBridge = require('@/native/live-activity.android').default as LiveActivityBridge;
const webBridge = require('@/native/live-activity.web').default as LiveActivityBridge;
const iosBridge = require('@/native/live-activity').default as LiveActivityBridge;

describe('live-activity bridge', () => {
  describe('Android stub', () => {
    it('imports without throwing', () => {
      expect(androidBridge).toBeDefined();
    });

    it('satisfies LiveActivityBridge interface', () => {
      expect(typeof androidBridge.isAvailable).toBe('function');
      expect(typeof androidBridge.start).toBe('function');
      expect(typeof androidBridge.update).toBe('function');
      expect(typeof androidBridge.end).toBe('function');
      expect(typeof androidBridge.current).toBe('function');
    });

    it('isAvailable() returns false', () => {
      expect(androidBridge.isAvailable()).toBe(false);
    });

    it('start() rejects with LiveActivityNotSupportedError', async () => {
      const error = await androidBridge.start({ name: 'demo', initialCounter: 0 }).catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('update() rejects with LiveActivityNotSupportedError', async () => {
      const error = await androidBridge.update({ counter: 1 }).catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('end() rejects with LiveActivityNotSupportedError', async () => {
      const error = await androidBridge.end().catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('current() resolves null', async () => {
      const result = await androidBridge.current();
      expect(result).toBeNull();
    });
  });

  describe('Web stub', () => {
    it('imports without throwing', () => {
      expect(webBridge).toBeDefined();
    });

    it('satisfies LiveActivityBridge interface', () => {
      expect(typeof webBridge.isAvailable).toBe('function');
      expect(typeof webBridge.start).toBe('function');
      expect(typeof webBridge.update).toBe('function');
      expect(typeof webBridge.end).toBe('function');
      expect(typeof webBridge.current).toBe('function');
    });

    it('isAvailable() returns false', () => {
      expect(webBridge.isAvailable()).toBe(false);
    });

    it('start() rejects with LiveActivityNotSupportedError', async () => {
      const error = await webBridge.start({ name: 'demo', initialCounter: 0 }).catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('update() rejects with LiveActivityNotSupportedError', async () => {
      const error = await webBridge.update({ counter: 1 }).catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('end() rejects with LiveActivityNotSupportedError', async () => {
      const error = await webBridge.end().catch((e) => e);
      expect(error).toBeInstanceOf(LiveActivityNotSupportedError);
      expect((error as LiveActivityNotSupportedError).code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
    });

    it('current() resolves null', async () => {
      const result = await webBridge.current();
      expect(result).toBeNull();
    });
  });

  describe('iOS bridge', () => {
    it('imports without throwing', () => {
      expect(iosBridge).toBeDefined();
    });

    it('satisfies LiveActivityBridge interface', () => {
      expect(typeof iosBridge.isAvailable).toBe('function');
      expect(typeof iosBridge.start).toBe('function');
      expect(typeof iosBridge.update).toBe('function');
      expect(typeof iosBridge.end).toBe('function');
      expect(typeof iosBridge.current).toBe('function');
    });

    // In Jest environment (not iOS), native module is not available
    it('isAvailable() returns false in test environment', () => {
      expect(iosBridge.isAvailable()).toBe(false);
    });

    it('current() resolves null when unavailable', async () => {
      const result = await iosBridge.current();
      expect(result).toBeNull();
    });

    it('start() rejects with LiveActivityNotSupportedError when unavailable', async () => {
      await expect(iosBridge.start({ name: 'demo', initialCounter: 0 })).rejects.toThrow(
        LiveActivityNotSupportedError,
      );
    });

    it('update() rejects with LiveActivityNotSupportedError when unavailable', async () => {
      await expect(iosBridge.update({ counter: 1 })).rejects.toThrow(LiveActivityNotSupportedError);
    });

    it('end() rejects with LiveActivityNotSupportedError when unavailable', async () => {
      await expect(iosBridge.end()).rejects.toThrow(LiveActivityNotSupportedError);
    });
  });

  describe('Error classes', () => {
    it('LiveActivityNotSupportedError has correct code', () => {
      const error = new LiveActivityNotSupportedError();
      expect(error.code).toBe('LIVE_ACTIVITY_NOT_SUPPORTED');
      expect(error.name).toBe('LiveActivityNotSupportedError');
      expect(error.message).toBeTruthy();
    });

    it('LiveActivityAuthorisationError has correct code', () => {
      const error = new LiveActivityAuthorisationError();
      expect(error.code).toBe('LIVE_ACTIVITY_AUTHORISATION');
      expect(error.name).toBe('LiveActivityAuthorisationError');
      expect(error.message).toBeTruthy();
    });

    it('LiveActivityNoActiveSessionError has correct code', () => {
      const error = new LiveActivityNoActiveSessionError();
      expect(error.code).toBe('LIVE_ACTIVITY_NO_SESSION');
      expect(error.name).toBe('LiveActivityNoActiveSessionError');
      expect(error.message).toBeTruthy();
    });

    it('LiveActivityAlreadyRunningError has correct code', () => {
      const error = new LiveActivityAlreadyRunningError();
      expect(error.code).toBe('LIVE_ACTIVITY_ALREADY_RUNNING');
      expect(error.name).toBe('LiveActivityAlreadyRunningError');
      expect(error.message).toBeTruthy();
    });
  });
});
