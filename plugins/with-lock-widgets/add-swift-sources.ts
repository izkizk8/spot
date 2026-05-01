/**
 * with-lock-widgets/add-swift-sources.ts
 *
 * Adds the lock-screen widget Swift sources to the existing 014
 * LiveActivityDemoWidget extension target's compile sources.
 * Idempotent — skips paths already known to the project.
 *
 * @see specs/027-lock-screen-widgets/tasks.md T044, T047
 */

import { ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as path from 'path';

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

    const widgetTarget = project.pbxTargetByName(WIDGET_TARGET_NAME);
    if (!widgetTarget) {
      throw new Error(
        `with-lock-widgets: Widget extension target '${WIDGET_TARGET_NAME}' not found. ` +
          `Ensure with-home-widgets plugin runs before with-lock-widgets.`,
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

      const fileRef = project.addFile(filePath, lockGroup.uuid, {
        target: widgetTarget.uuid,
        sourceTree: '"<group>"',
      });

      if (fileRef) {
        project.addToPbxSourcesBuildPhase(fileRef, widgetTarget.uuid);
      }
    }

    return cfg;
  });
};
