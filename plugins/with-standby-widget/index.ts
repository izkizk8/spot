/**
 * with-standby-widget — Expo config plugin for feature 028.
 *
 * Adds the four StandBy WidgetKit Swift sources to 014's extension
 * target and inserts StandByWidget() into the widget bundle between
 * 014's bundle markers (after 027's LockScreenAccessoryWidget() entry).
 *
 * Idempotent and commutative with both 014's and 027's plugins (R-A).
 * No new entitlements, no new App Group, no new extension target
 * (FR-SB-019, FR-SB-020).
 *
 * @see specs/028-standby-mode/tasks.md T045, T048
 */

import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { withStandByWidgetSwiftSources } from './add-swift-sources';
import { insertBundleEntry } from './insert-bundle-entry';

const BUNDLE_FILE_PATH = 'ios/LiveActivityDemoWidget/SpotWidgetBundle.swift';

const withInsertBundleEntry: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const bundlePath = path.join(cfg.modRequest.platformProjectRoot, BUNDLE_FILE_PATH);
      if (!fs.existsSync(bundlePath)) {
        // 014 plugin hasn't run yet (markers come from 014). Skip.
        return cfg;
      }
      const source = fs.readFileSync(bundlePath, 'utf8');
      const updated = insertBundleEntry(source);
      fs.writeFileSync(bundlePath, updated, 'utf8');
      return cfg;
    },
  ]);
};

const withStandByWidget: ConfigPlugin = (config) => {
  config = withStandByWidgetSwiftSources(config);
  config = withInsertBundleEntry(config);
  return config;
};

export default withStandByWidget;
