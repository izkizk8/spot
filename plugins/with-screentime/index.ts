/**
 * with-screentime — composed Expo config plugin for feature 015
 * (ScreenTime / FamilyControls Showcase Module).
 *
 * Order of operations (all idempotent):
 *   1. add-entitlement      — `com.apple.developer.family-controls` on
 *                             the main app (Apple approval required at
 *                             distribution time; FR-019).
 *   2. add-monitor-extension — `SpotScreenTimeMonitor` extension target
 *                             with bundle-ID suffix `.screentimemonitor`,
 *                             extension point
 *                             `com.apple.deviceactivity.monitor-extension`,
 *                             deployment target iOS 16.0 (FR-020).
 *   3. consume-app-group     — Reads (does NOT modify) feature 014's App
 *                             Group marker and attaches the same App
 *                             Group entitlement to the monitor extension
 *                             only (FR-021).
 *
 * Running the plugin twice on the same Expo config produces a deep-equal
 * config (FR-022).
 *
 * @see specs/015-screentime-api/tasks.md T018, T022
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
import { withScreenTimeEntitlement } from './add-entitlement.ts';
import { withScreenTimeMonitorExtension } from './add-monitor-extension.ts';
import { withScreenTimeAppGroup } from './consume-app-group.ts';

const withScreenTime: ConfigPlugin = (config) => {
  config = withScreenTimeEntitlement(config);
  config = withScreenTimeMonitorExtension(config);
  config = withScreenTimeAppGroup(config);
  return config;
};

export default withScreenTime;
