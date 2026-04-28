/**
 * with-lock-widgets — Expo config plugin for feature 027.
 *
 * Adds lock-screen widget Swift sources to 014's extension target and
 * inserts LockScreenAccessoryWidget() into the widget bundle.
 *
 * Idempotent, commutative with 014's plugin. No new entitlements, no new targets.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T045, T048
 */

import { ConfigPlugin, withDangerousMod } from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { withLockWidgetsSwiftSources } from './add-swift-sources';
import { insertBundleEntry } from './insert-bundle-entry';

const BUNDLE_FILE_PATH = 'ios/LiveActivityDemoWidget/SpotWidgetBundle.swift';

const withInsertBundleEntry: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const bundlePath = path.join(cfg.modRequest.platformProjectRoot, BUNDLE_FILE_PATH);

      if (!fs.existsSync(bundlePath)) {
        // Bundle file not yet generated — 014 plugin hasn't run yet. Skip.
        return cfg;
      }

      const source = fs.readFileSync(bundlePath, 'utf8');
      const updated = insertBundleEntry(source);
      fs.writeFileSync(bundlePath, updated, 'utf8');

      return cfg;
    },
  ]);
};

const withLockWidgets: ConfigPlugin = (config) => {
  config = withLockWidgetsSwiftSources(config);
  config = withInsertBundleEntry(config);
  return config;
};

export default withLockWidgets;
