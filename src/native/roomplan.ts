/**
 * RoomPlan Bridge — iOS variant (feature 048).
 *
 * Single seam where the `RoomCaptureBridge` Expo Module is
 * touched. The native module is resolved via
 * `requireOptionalNativeModule` so the surface is null-safe in
 * unit tests where the module is absent.
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  type RoomCaptureResult,
  RoomPlanNotSupported,
  type ScanPhaseListener,
} from './roomplan.types';

export { RoomPlanNotSupported };

interface NativeRoomPlan {
  isSupported(): boolean;
  startCapture(): Promise<RoomCaptureResult>;
  stopCapture(): Promise<void>;
  exportUSDZ(roomId: string): Promise<string>;
  addListener?(name: string): void;
  removeListeners?(count: number): void;
  addPhaseListener?(cb: ScanPhaseListener): { remove: () => void };
}

function getNative(): NativeRoomPlan | null {
  return requireOptionalNativeModule<NativeRoomPlan>(NATIVE_MODULE_NAME);
}

function ensureNative(): NativeRoomPlan {
  if (Platform.OS !== 'ios') {
    throw new RoomPlanNotSupported(`RoomPlan is not available on ${Platform.OS}`);
  }
  const native = getNative();
  if (!native) {
    throw new RoomPlanNotSupported('RoomPlan native module is not registered');
  }
  return native;
}

export function isSupported(): boolean {
  if (Platform.OS !== 'ios') return false;
  const native = getNative();
  return native !== null && native.isSupported();
}

export function startCapture(): Promise<RoomCaptureResult> {
  try {
    return ensureNative().startCapture();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function stopCapture(): Promise<void> {
  try {
    return ensureNative().stopCapture();
  } catch (err) {
    return Promise.reject(err);
  }
}

export function exportUSDZ(roomId: string): Promise<string> {
  try {
    return ensureNative().exportUSDZ(roomId);
  } catch (err) {
    return Promise.reject(err);
  }
}

export function subscribe(listener: ScanPhaseListener): () => void {
  if (Platform.OS !== 'ios') return () => {};
  const native = getNative();
  if (!native || typeof native.addPhaseListener !== 'function') return () => {};
  const sub = native.addPhaseListener(listener);
  return () => {
    sub.remove();
  };
}

export const roomplan = {
  isSupported,
  startCapture,
  stopCapture,
  exportUSDZ,
  subscribe,
};

export default roomplan;
