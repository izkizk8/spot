/**
 * Controls Bridge Types
 * Feature: 087-controls
 *
 * Type definitions for the iOS 18+ Control Center controls bridge.
 * Covers ControlWidget / ControlValueProvider / AppIntent-driven controls.
 */

export const NATIVE_MODULE_NAME = 'SpotControls' as const;

/** Which Controls APIs are available on the current device. */
export interface ControlsCapabilities {
  /** ControlWidget API — iOS 18.0+ */
  controlWidget: boolean;
  /** ControlValueProvider — iOS 18.0+ */
  valueProvider: boolean;
  /** OS version string, e.g. "18.0" */
  osVersion: string;
}

/** The kind of control widget. */
export type ControlKind = 'button' | 'toggle';

/** A registered control descriptor. */
export interface ControlInfo {
  id: string;
  kind: ControlKind;
  title: string;
  systemImageName: string;
  /** Whether the control is currently active/on (toggle only). */
  isOn: boolean | null;
}

/** Result of triggering a control action. */
export interface ControlActionResult {
  controlId: string;
  success: boolean;
  newValue: boolean | null;
  triggeredAt: string;
}

export interface ControlsBridge {
  getCapabilities(): Promise<ControlsCapabilities>;
  getRegisteredControls(): Promise<readonly ControlInfo[]>;
  triggerControl(controlId: string): Promise<ControlActionResult>;
}

export class ControlsNotSupported extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControlsNotSupported';
  }
}
