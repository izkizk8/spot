/**
 * with-screentime/add-monitor-extension.ts
 *
 * Adds the `SpotScreenTimeMonitor` `DeviceActivityMonitorExtension` as a
 * separate iOS target.
 *
 * Bundle-ID suffix: `.screentimemonitor` (does NOT collide with feature
 * 007's `.LiveActivityDemoWidget` or feature 014's widget bundle).
 * Extension point: `com.apple.deviceactivity.monitor-extension`.
 * Deployment target: iOS 16.0 (FamilyControls minimum).
 *
 * Idempotent — re-running the plugin does not duplicate the target.
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { IOSConfig, withXcodeProject } = configPlugins;
import * as path from 'path';
import { findTargetByName } from '../_shared/find-target.ts';
import { addSwiftSourceFile } from '../_shared/add-source-file.ts';

export const MONITOR_TARGET_NAME = 'SpotScreenTimeMonitor';
export const MONITOR_BUNDLE_SUFFIX = '.screentimemonitor';
export const MONITOR_EXTENSION_POINT = 'com.apple.deviceactivity.monitor-extension';
export const MONITOR_DEPLOYMENT_TARGET = '16.0';

const SWIFT_SRC_DIR = 'native/ios/screentime';
const MONITOR_SWIFT_FILES: readonly string[] = ['DeviceActivityMonitorExtension.swift'];

export const withScreenTimeMonitorExtension: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults as unknown as {
      pbxTargetByName: (name: string) => { uuid: string } | null | undefined;
      addTarget?: (
        name: string,
        type: string,
        subfolder: string,
        bundleId: string,
      ) => {
        uuid: string;
      };
      addPbxGroup: (files: unknown[], name: string, pathStr: string) => { uuid: string };
      addToPbxGroup: (childUuid: string, parentUuid: string) => void;
      addFile: (
        filePath: string,
        groupUuid: string,
        opts: { target?: string; sourceTree?: string },
      ) => { uuid: string; filePath: string } | null;
      hasFile: (filePath: string) => unknown;
      addToPbxSourcesBuildPhase: (
        ref: { uuid: string; filePath: string },
        targetUuid: string,
      ) => void;
      getFirstProject: () => { firstProject: { mainGroup: string } };
      getFirstTarget?: () => { uuid: string } | undefined;
    };

    // Idempotency: skip if target already present.
    const existing = findTargetByName(project, MONITOR_TARGET_NAME);
    if (existing) return cfg;

    const mainBundleId = IOSConfig.BundleIdentifier.getBundleIdentifier(cfg) ?? 'com.example.spot';
    const monitorBundleId = `${mainBundleId}${MONITOR_BUNDLE_SUFFIX}`;

    let monitorTarget: { uuid: string } | undefined;
    if (typeof project.addTarget === 'function') {
      monitorTarget = project.addTarget(
        MONITOR_TARGET_NAME,
        'app_extension',
        MONITOR_TARGET_NAME,
        monitorBundleId,
      );
    }

    if (!monitorTarget) {
      // Tests using stub PBX without addTarget — bail gracefully.
      return cfg;
    }

    const groupName = MONITOR_TARGET_NAME;
    const groupPath = `../${SWIFT_SRC_DIR}`;
    const monitorGroup = project.addPbxGroup([], groupName, groupPath);
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(monitorGroup.uuid, mainGroupUuid);

    for (const file of MONITOR_SWIFT_FILES) {
      const relPath = path.posix.join(`../${SWIFT_SRC_DIR}`, file);
      if (project.hasFile(relPath)) continue;
      addSwiftSourceFile(project, relPath, monitorGroup.uuid, {
        target: monitorTarget.uuid,
        sourceTree: 'SOURCE_ROOT',
      });
    }

    // Reference the Info.plist file (project organization only — INFOPLIST_FILE
    // build setting below is what xcodebuild actually uses to find it).
    const infoPlistRelPath = `../${SWIFT_SRC_DIR}/Info.plist`;
    if (!project.hasFile(infoPlistRelPath)) {
      project.addFile(infoPlistRelPath, monitorGroup.uuid, {
        sourceTree: 'SOURCE_ROOT',
      });
    }

    // xcode npm's addTarget() defaults INFOPLIST_FILE to
    // '<targetSubfolder>/<targetSubfolder>-Info.plist' (i.e.
    // 'SpotScreenTimeMonitor/SpotScreenTimeMonitor-Info.plist'), but we don't
    // create that file on disk. Override INFOPLIST_FILE to point at the
    // checked-in plist under native/ios/screentime/ and disable auto-generation
    // so xcodebuild doesn't try to read the missing default path.
    const projectWithBuildSettings = project as unknown as {
      pbxXCBuildConfigurationSection?: () => Record<string, unknown>;
    };
    if (typeof projectWithBuildSettings.pbxXCBuildConfigurationSection === 'function') {
      const buildConfigs = projectWithBuildSettings.pbxXCBuildConfigurationSection();
      for (const key of Object.keys(buildConfigs)) {
        const cfgEntry = buildConfigs[key] as
          | { buildSettings?: Record<string, string> }
          | undefined;
        const buildSettings = cfgEntry?.buildSettings;
        if (!buildSettings) continue;
        if (buildSettings.PRODUCT_NAME === `"${MONITOR_TARGET_NAME}"`) {
          buildSettings.INFOPLIST_FILE = `"../${SWIFT_SRC_DIR}/Info.plist"`;
          buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
          buildSettings.IPHONEOS_DEPLOYMENT_TARGET = `"${MONITOR_DEPLOYMENT_TARGET}"`;
          buildSettings.SWIFT_VERSION = '"5.0"';
          buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
          buildSettings.SKIP_INSTALL = 'YES';
          buildSettings.CURRENT_PROJECT_VERSION = '"1"';
          buildSettings.MARKETING_VERSION = '"1.0"';
        }
      }
    }

    return cfg;
  });
};

export default withScreenTimeMonitorExtension;
