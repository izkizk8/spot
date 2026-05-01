/**
 * Controls Bridge — Android stub (feature 087).
 *
 * Control Center controls are iOS-only. All methods reject with ControlsNotSupported.
 * MUST NOT import the iOS variant.
 */
import {
  ControlsNotSupported,
  type ControlActionResult,
  type ControlInfo,
  type ControlsBridge,
  type ControlsCapabilities,
} from './controls.types';

export { ControlsNotSupported };

const ERR = (): ControlsNotSupported =>
  new ControlsNotSupported('Control Center controls are not available on Android');

export function getCapabilities(): Promise<ControlsCapabilities> {
  return Promise.reject(ERR());
}

export function getRegisteredControls(): Promise<readonly ControlInfo[]> {
  return Promise.reject(ERR());
}

export function triggerControl(_controlId: string): Promise<ControlActionResult> {
  return Promise.reject(ERR());
}

export const controls: ControlsBridge = {
  getCapabilities,
  getRegisteredControls,
  triggerControl,
};

export default controls;
