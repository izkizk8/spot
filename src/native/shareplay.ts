/**
 * SharePlay Bridge — iOS variant (feature 047).
 *
 * Single seam where the `SharePlayBridge` Expo Module is touched.
 * On Android / Web the platform-specific siblings throw
 * `SharePlayNotSupported` for every async method.
 *
 * The native module is resolved via `requireOptionalNativeModule`
 * so the surface is null-safe in unit tests where the module is
 * absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  type ActivityConfig,
  INITIAL_SESSION_STATE,
  NATIVE_MODULE_NAME,
  type SessionState,
  type SessionStateListener,
  SharePlayNotSupported,
} from './shareplay.types';

export { SharePlayNotSupported };

interface NativeSharePlayBridge {
  isAvailable(): boolean;
  getState(): SessionState;
  startActivity(config: ActivityConfig): Promise<void>;
  endActivity(): Promise<void>;
  sendCounter(value: number): Promise<void>;
  addListener?(name: string): void;
  removeListeners?(count: number): void;
  addStateListener?(cb: SessionStateListener): { remove: () => void };
}

function getNative(): NativeSharePlayBridge | null {
  return requireOptionalNativeModule<NativeSharePlayBridge>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeSharePlayBridge {
  if (Platform.OS !== 'ios') {
    throw new SharePlayNotSupported(`SharePlay is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new SharePlayNotSupported('SharePlay native module is not registered');
  }
  return native;
}

export function isAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isAvailable();
}

export function getState(): SessionState {
  if (Platform.OS !== 'ios') return INITIAL_SESSION_STATE;
  const native = getNative();
  if (!native) return INITIAL_SESSION_STATE;
  return native.getState();
}

export function startActivity(config: ActivityConfig): Promise<void> {
  try {
    return ensureNative().startActivity(config);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function endActivity(): Promise<void> {
  try {
    return ensureNative().endActivity();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function sendCounter(value: number): Promise<void> {
  try {
    return ensureNative().sendCounter(value);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function subscribe(listener: SessionStateListener): () => void {
  if (Platform.OS !== 'ios') return () => {};
  const native = getNative();
  if (!native || typeof native.addStateListener !== 'function') return () => {};
  const sub = native.addStateListener(listener);
  return () => {
    sub.remove();
  };
}

export const shareplay = {
  isAvailable,
  getState,
  startActivity,
  endActivity,
  sendCounter,
  subscribe,
};

export default shareplay;
