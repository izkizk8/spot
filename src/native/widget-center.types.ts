// src/native/widget-center.types.ts
import type { WidgetConfig, Tint } from '@/modules/widgets-lab/widget-config';

export type { WidgetConfig, Tint };

export class WidgetCenterNotSupportedError extends Error {
  constructor(message = 'WidgetCenter is only available on iOS 14+') {
    super(message);
    this.name = 'WidgetCenterNotSupportedError';
  }
}

export class WidgetCenterBridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WidgetCenterBridgeError';
  }
}

export interface WidgetCenterBridge {
  /** Synchronous; never throws. */
  isAvailable(): boolean;
  /** Reads the App Group suite. Returns DEFAULT_CONFIG when suite is empty. */
  getCurrentConfig(): Promise<WidgetConfig>;
  /** Writes the supplied config to the App Group suite. */
  setConfig(config: WidgetConfig): Promise<void>;
  /** Calls WidgetCenter.shared.reloadAllTimelines(); resolves once issued. */
  reloadAllTimelines(): Promise<void>;
}
