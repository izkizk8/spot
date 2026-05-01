/**
 * Android stub for the ScreenTime bridge — every async method rejects with
 * `ScreenTimeNotSupportedError`. Mirrors the widget-center.android pattern.
 */

import type {
  AuthorizationStatus,
  MonitoringSchedule,
  ScreenTimeBridge,
  SelectionSummary,
} from './screentime.types';
import { ScreenTimeNotSupportedError } from './screentime.types';

const bridge: ScreenTimeBridge = {
  isAvailable(): boolean {
    return false;
  },
  entitlementsAvailable(): Promise<boolean> {
    return Promise.resolve(false);
  },
  async requestAuthorization(): Promise<AuthorizationStatus> {
    throw new ScreenTimeNotSupportedError();
  },
  async getAuthorizationStatus(): Promise<AuthorizationStatus> {
    throw new ScreenTimeNotSupportedError();
  },
  async pickActivity(): Promise<SelectionSummary> {
    throw new ScreenTimeNotSupportedError();
  },
  async applyShielding(_token: string): Promise<void> {
    throw new ScreenTimeNotSupportedError();
  },
  async clearShielding(): Promise<void> {
    throw new ScreenTimeNotSupportedError();
  },
  async startMonitoring(_token: string, _schedule: MonitoringSchedule): Promise<void> {
    throw new ScreenTimeNotSupportedError();
  },
  async stopMonitoring(): Promise<void> {
    throw new ScreenTimeNotSupportedError();
  },
};

export default bridge;
