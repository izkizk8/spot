// src/native/widget-center.web.ts
import type { WidgetCenterBridge, WidgetConfig } from './widget-center.types';
import { WidgetCenterNotSupportedError } from './widget-center.types';

const bridge: WidgetCenterBridge = {
  isAvailable(): boolean {
    return false;
  },

  async getCurrentConfig(): Promise<WidgetConfig> {
    throw new WidgetCenterNotSupportedError();
  },

  async setConfig(_config: WidgetConfig): Promise<void> {
    throw new WidgetCenterNotSupportedError();
  },

  async reloadAllTimelines(): Promise<void> {
    throw new WidgetCenterNotSupportedError();
  },
};

export default bridge;
