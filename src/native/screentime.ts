/**
 * iOS JS bridge for ScreenTime / FamilyControls (feature 015).
 *
 * Mirrors the precedent set by feature 014's `widget-center.ts` and
 * feature 013's `app-intents.ts`.
 *
 * Routing rules:
 *   - `isAvailable()` is synchronous; returns `false` when the optional
 *     native module is absent.
 *   - `entitlementsAvailable()` NEVER throws; resolves `false` on any
 *     failure. Memoized for the process lifetime.
 *   - Every other async method rejects with `EntitlementMissingError`
 *     when the entitlement probe returned `false`.
 */

import { requireOptionalNativeModule } from 'expo-modules-core';

import type {
  AuthorizationStatus,
  MonitoringSchedule,
  ScreenTimeBridge,
  SelectionSummary,
} from './screentime.types';
import { EntitlementMissingError } from './screentime.types';

interface NativeScreenTime {
  isAvailable(): boolean;
  entitlementsAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<AuthorizationStatus>;
  getAuthorizationStatus(): Promise<AuthorizationStatus>;
  pickActivity(): Promise<SelectionSummary>;
  applyShielding(token: string): Promise<void>;
  clearShielding(): Promise<void>;
  startMonitoring(token: string, schedule: MonitoringSchedule): Promise<void>;
  stopMonitoring(): Promise<void>;
}

const native = requireOptionalNativeModule<NativeScreenTime>('SpotScreenTime');

let entitlementProbe: Promise<boolean> | null = null;

function probeEntitlement(): Promise<boolean> {
  if (entitlementProbe !== null) return entitlementProbe;
  if (native === null) {
    entitlementProbe = Promise.resolve(false);
    return entitlementProbe;
  }
  entitlementProbe = native
    .entitlementsAvailable()
    .then((v) => v === true)
    .catch(() => false);
  return entitlementProbe;
}

async function requireEntitled(): Promise<NativeScreenTime> {
  const ok = await probeEntitlement();
  if (!ok || native === null) {
    throw new EntitlementMissingError();
  }
  return native;
}

const bridge: ScreenTimeBridge = {
  isAvailable(): boolean {
    return native !== null;
  },
  entitlementsAvailable(): Promise<boolean> {
    return probeEntitlement();
  },
  async requestAuthorization(): Promise<AuthorizationStatus> {
    const m = await requireEntitled();
    return m.requestAuthorization();
  },
  async getAuthorizationStatus(): Promise<AuthorizationStatus> {
    const m = await requireEntitled();
    return m.getAuthorizationStatus();
  },
  async pickActivity(): Promise<SelectionSummary> {
    const m = await requireEntitled();
    return m.pickActivity();
  },
  async applyShielding(token: string): Promise<void> {
    const m = await requireEntitled();
    return m.applyShielding(token);
  },
  async clearShielding(): Promise<void> {
    const m = await requireEntitled();
    return m.clearShielding();
  },
  async startMonitoring(token: string, schedule: MonitoringSchedule): Promise<void> {
    const m = await requireEntitled();
    return m.startMonitoring(token, schedule);
  },
  async stopMonitoring(): Promise<void> {
    const m = await requireEntitled();
    return m.stopMonitoring();
  },
};

export default bridge;
