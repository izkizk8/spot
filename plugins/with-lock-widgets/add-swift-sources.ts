/**
 * with-lock-widgets/add-swift-sources.ts
 *
 * Adds the lock-screen widget Swift sources to the existing 014
 * LiveActivityDemoWidget extension target's compile sources.
 * Idempotent — skips paths already known to the project.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T044, T047
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withXcodeProject } = configPlugins;
import * as path from 'path';
import { findTargetByName } from '../_shared/find-target.ts';
import { addSwiftSourceFile } from '../_shared/add-source-file.ts';

const WIDGET_TARGET_NAME = 'LiveActivityDemoWidget';
const SOURCE_DIR_REL = '../native/ios/widgets/lock-screen';

const LOCK_SCREEN_FILES: readonly string[] = [
  'LockScreenAccessoryWidget.swift',
  'LockScreenAccessoryProvider.swift',
  'LockScreenAccessoryEntry.swift',
  'LockScreenAccessoryViews.swift',
];

export const withLockWidgetsSwiftSources: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults as unknown as {
      pbxTargetByName: (name: string) => { uuid: string } | null;
      addPbxGroup: (files: unknown[], name: string, path: string) => { uuid: string };
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
    };

    const widgetTarget = findTargetByName(project, WIDGET_TARGET_NAME);
    if (!widgetTarget) {
      throw new Error(
        `with-lock-widgets: Widget extension target '${WIDGET_TARGET_NAME}' not found. ` +
          `Ensure with-live-activity plugin is registered (and runs first in the xcodeproj mod chain).`,
      );
    }

    const groupName = 'SpotLockScreenWidget';
    const lockGroup = project.addPbxGroup([], groupName, SOURCE_DIR_REL);
    const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
    project.addToPbxGroup(lockGroup.uuid, mainGroupUuid);

    for (const fileName of LOCK_SCREEN_FILES) {
      const filePath = path.posix.join(SOURCE_DIR_REL, fileName);

      // Idempotency: skip if already present
      if (project.hasFile(filePath)) {
        continue;
      }

      addSwiftSourceFile(project, filePath, lockGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: '"<group>"',
      });
    }

    return cfg;
  });
};
