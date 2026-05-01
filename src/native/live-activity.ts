/**
 * Live Activity bridge for iOS.
 *
 * Uses requireOptionalNativeModule so we don't crash on import if the
 * native module isn't linked. The native module is only available when
 * running on iOS 16.1+ with a prebuild that includes the widget extension.
 *
 * @see specs/007-live-activities-dynamic-island/contracts/live-activity-bridge.md
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  LiveActivityBridge,
  LiveActivitySession,
  LiveActivityStartArgs,
  LiveActivityState,
} from './live-activity.types';
import {
  LiveActivityAlreadyRunningError,
  LiveActivityAuthorisationError,
  LiveActivityNoActiveSessionError,
  LiveActivityNotSupportedError,
} from './live-activity.types';

// Attempt to resolve the native module. Returns null if not present.
const native = requireOptionalNativeModule<{
  isAvailable(): boolean;
  start(args: { name: string; initialCounter: number }): Promise<LiveActivitySession>;
  update(state: { counter: number }): Promise<LiveActivitySession>;
  end(): Promise<void>;
  current(): Promise<LiveActivitySession | null>;
}>('LiveActivityDemo');

/**
 * Maps native error codes to typed JS errors.
 * Native codes: 'AUTHORISATION', 'NO_SESSION', 'ALREADY_RUNNING', 'NOT_SUPPORTED'
 */
function mapNativeError(err: unknown): Error {
  if (err instanceof Error) {
    const message = err.message;
    if (message.includes('AUTHORISATION')) {
      return new LiveActivityAuthorisationError();
    }
    if (message.includes('NO_SESSION')) {
      return new LiveActivityNoActiveSessionError();
    }
    if (message.includes('ALREADY_RUNNING')) {
      return new LiveActivityAlreadyRunningError();
    }
    if (message.includes('NOT_SUPPORTED')) {
      return new LiveActivityNotSupportedError();
    }
    return err;
  }
  return new Error(String(err));
}

/**
 * Get iOS version as a float. Returns 0 if not iOS.
 */
function getIOSVersion(): number {
  if (Platform.OS !== 'ios') return 0;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseFloat(version);
  }
  return version;
}

const bridge: LiveActivityBridge = {
  isAvailable(): boolean {
    return Platform.OS === 'ios' && getIOSVersion() >= 16.1 && native !== null;
  },

  async start(args: LiveActivityStartArgs): Promise<LiveActivitySession> {
    if (!bridge.isAvailable() || native === null) {
      throw new LiveActivityNotSupportedError();
    }

    // JS-side validation
    if (!args.name || args.name.length < 1) {
      throw new Error('name must be non-empty');
    }
    if (args.initialCounter < 0) {
      throw new Error('initialCounter must be >= 0');
    }

    try {
      return await native.start({
        name: args.name,
        initialCounter: args.initialCounter,
      });
    } catch (err) {
      throw mapNativeError(err);
    }
  },

  async update(state: LiveActivityState): Promise<LiveActivitySession> {
    if (!bridge.isAvailable() || native === null) {
      throw new LiveActivityNotSupportedError();
    }

    // JS-side validation
    if (state.counter < 0) {
      throw new Error('counter must be >= 0');
    }

    try {
      return await native.update({ counter: state.counter });
    } catch (err) {
      throw mapNativeError(err);
    }
  },

  async end(): Promise<void> {
    if (!bridge.isAvailable() || native === null) {
      throw new LiveActivityNotSupportedError();
    }

    try {
      await native.end();
    } catch (err) {
      throw mapNativeError(err);
    }
  },

  async current(): Promise<LiveActivitySession | null> {
    // MUST NOT throw — on any native error, resolve null (FR-009)
    if (!bridge.isAvailable() || native === null) {
      return null;
    }

    try {
      return await native.current();
    } catch {
      return null;
    }
  },
};

export default bridge;
