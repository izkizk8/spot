/**
 * ARKit Bridge - iOS variant
 * Feature: 034-arkit-basics
 *
 * Single seam where the iOS-only ARKitBridge native module is touched.
 * Resolves to a rejecting bridge on non-iOS platforms via platform-specific siblings.
 *
 * Mutating method calls are serialised through a single closure-scoped promise chain
 * so back-to-back calls produce native invocations in submission order even when an
 * earlier call rejects (R-A).
 *
 * @see specs/034-arkit-basics/contracts/arkit-bridge.contract.ts
 * @see specs/034-arkit-basics/research.md §1 (R-A serialisation)
 */

import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import {
  NATIVE_MODULE_NAME,
  ARKitNotSupported,
  AnchorRecord,
  SessionInfo,
} from './arkit.types';

export { ARKitNotSupported };

interface NativeARKitBridge {
  placeAnchorAt(x: number, y: number): Promise<AnchorRecord | null>;
  clearAnchors(): Promise<void>;
  pauseSession(): Promise<void>;
  resumeSession(): Promise<void>;
  getSessionInfo(): Promise<SessionInfo>;
  isAvailable(): boolean;
}

const native =
  requireOptionalNativeModule<NativeARKitBridge>(NATIVE_MODULE_NAME);

function isReady(): boolean {
  return Platform.OS === 'ios' && native != null;
}

/**
 * Single in-memory promise chain. Every async bridge call queues onto this
 * chain so that even if an earlier call rejects, the next call still
 * executes (R-A). The chain stores `unknown` because each link's value is
 * irrelevant to the next.
 */
let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = chain.then(fn, fn); // Run fn regardless of prior outcome
  // Swallow rejections on the chain reference itself so subsequent calls proceed
  chain = result.catch(() => undefined);
  return result; // Preserve original rejection for the caller
}

/**
 * Raycast at the given screen-space point and place a textured cube anchor
 * on the first detected plane. Returns the anchor record on success, null
 * if raycast misses, rejects on error.
 */
export function placeAnchorAt(
  x: number,
  y: number,
): Promise<AnchorRecord | null> {
  if (!isReady()) {
    return Promise.reject(
      new ARKitNotSupported('ARKit bridge is not available'),
    );
  }
  return enqueue(() => native.placeAnchorAt(x, y));
}

/**
 * Remove all anchors placed by this session and emit onAnchorRemoved for each.
 */
export function clearAnchors(): Promise<void> {
  if (!isReady()) {
    return Promise.reject(
      new ARKitNotSupported('ARKit bridge is not available'),
    );
  }
  return enqueue(() => native.clearAnchors());
}

/**
 * Pause the underlying ARSession. FPS drops to 0, duration counter freezes.
 */
export function pauseSession(): Promise<void> {
  if (!isReady()) {
    return Promise.reject(
      new ARKitNotSupported('ARKit bridge is not available'),
    );
  }
  return enqueue(() => native.pauseSession());
}

/**
 * Resume the session with the current configuration. Duration counter continues.
 */
export function resumeSession(): Promise<void> {
  if (!isReady()) {
    return Promise.reject(
      new ARKitNotSupported('ARKit bridge is not available'),
    );
  }
  return enqueue(() => native.resumeSession());
}

/**
 * Poll current session info (state, anchorCount, fps, duration, trackingState).
 * Default polling cadence: 500 ms (R-D).
 */
export function getSessionInfo(): Promise<SessionInfo> {
  if (!isReady()) {
    return Promise.reject(
      new ARKitNotSupported('ARKit bridge is not available'),
    );
  }
  return enqueue(() => native.getSessionInfo());
}

/**
 * Returns true only on iOS when ARWorldTrackingConfiguration.isSupported is true.
 * Never throws; returns false on Android, Web, and unsupported iOS devices.
 */
export function isAvailable(): boolean {
  if (!isReady()) {
    return false;
  }
  try {
    return native.isAvailable();
  } catch {
    return false;
  }
}
