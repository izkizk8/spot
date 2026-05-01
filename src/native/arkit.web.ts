/**
 * ARKit Bridge - Web variant
 * Feature: 034-arkit-basics
 *
 * All async methods throw ARKitNotSupported; isAvailable() returns false.
 * MUST NOT import the iOS bridge file (arkit.ts) at module evaluation time.
 *
 * @see specs/034-arkit-basics/contracts/arkit-bridge.contract.ts
 */

import { ARKitNotSupported, AnchorRecord, SessionInfo } from './arkit.types';

export { ARKitNotSupported };

const notSupportedError = new ARKitNotSupported('ARKit is not available on Web');

export function placeAnchorAt(_x: number, _y: number): Promise<AnchorRecord | null> {
  return Promise.reject(notSupportedError);
}

export function clearAnchors(): Promise<void> {
  return Promise.reject(notSupportedError);
}

export function pauseSession(): Promise<void> {
  return Promise.reject(notSupportedError);
}

export function resumeSession(): Promise<void> {
  return Promise.reject(notSupportedError);
}

export function getSessionInfo(): Promise<SessionInfo> {
  return Promise.reject(notSupportedError);
}

export function isAvailable(): boolean {
  return false;
}
