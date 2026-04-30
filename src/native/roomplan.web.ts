/**
 * RoomPlan Bridge — Web variant (feature 048).
 *
 * Every async method rejects with `RoomPlanNotSupported`;
 * `isSupported()` returns false; `subscribe()` is a no-op.
 * MUST NOT import the iOS variant.
 */

import { RoomPlanNotSupported, type ScanPhaseListener } from './roomplan.types';
import type { RoomCaptureResult } from './roomplan.types';

export { RoomPlanNotSupported };

const ERR = (): RoomPlanNotSupported =>
  new RoomPlanNotSupported('RoomPlan is not available on Web');

export function isSupported(): boolean {
  return false;
}

export function startCapture(): Promise<RoomCaptureResult> {
  return Promise.reject(ERR());
}

export function stopCapture(): Promise<void> {
  return Promise.reject(ERR());
}

export function exportUSDZ(_roomId: string): Promise<string> {
  return Promise.reject(ERR());
}

export function subscribe(_listener: ScanPhaseListener): () => void {
  return () => {};
}

export const roomplan = {
  isSupported,
  startCapture,
  stopCapture,
  exportUSDZ,
  subscribe,
};

export default roomplan;
