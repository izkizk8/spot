// src/native/widget-center.web.ts
import type {
  WidgetCenterBridge,
  WidgetConfig,
  LockConfig,
  StandByConfig,
} from './widget-center.types';
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

  async reloadTimelinesByKind(_kind: string): Promise<void> {
    throw new WidgetCenterNotSupportedError('Lock screen widgets are iOS-only');
  },

  async getLockConfig(): Promise<LockConfig> {
    throw new WidgetCenterNotSupportedError('Lock screen widgets are iOS-only');
  },

  async setLockConfig(_config: LockConfig): Promise<void> {
    throw new WidgetCenterNotSupportedError('Lock screen widgets are iOS-only');
  },

  async getStandByConfig(): Promise<StandByConfig> {
    throw new WidgetCenterNotSupportedError('StandBy widget is iOS-only');
  },

  async setStandByConfig(_config: StandByConfig): Promise<void> {
    throw new WidgetCenterNotSupportedError('StandBy widget is iOS-only');
  },
};

export default bridge;
