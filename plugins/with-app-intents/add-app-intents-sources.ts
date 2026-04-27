/**
 * Adds the four App Intents Swift sources to the main app target.
 *
 * Idempotent: a second invocation MUST NOT add duplicate file refs.
 *
 * @see specs/013-app-intents/contracts/module-manifest.md
 */

import { type ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as path from 'path';

const SWIFT_SRC_DIR = 'native/ios/app-intents';
const SWIFT_FILES: readonly string[] = [
  'LogMoodIntent.swift',
  'GetLastMoodIntent.swift',
  'GreetUserIntent.swift',
  'SpotAppShortcuts.swift',
];

interface PbxProject {
  getFirstTarget?: () => { uuid: string } | undefined;
  pbxTargetByName?: (name: string) => { uuid: string } | undefined;
  hasFile?: (p: string) => unknown;
  addFile?: (
    p: string,
    groupUuid: string | undefined,
    opts?: { sourceTree?: string; target?: string },
  ) => { uuid: string } | undefined;
  addToPbxSourcesBuildPhase?: (fileRef: { uuid: string }, targetUuid: string) => void;
  addPbxGroup?: (files: string[], name: string, pathStr: string) => { uuid: string };
  getFirstProject?: () => { firstProject: { mainGroup: string } };
  addToPbxGroup?: (groupUuid: string, parentUuid: string) => void;
}

export const withAppIntentsSources: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults as unknown as PbxProject;
    const projectName = cfg.modRequest.projectName ?? 'spot';

    const mainTarget = project.pbxTargetByName?.(projectName) ?? project.getFirstTarget?.();
    if (!mainTarget) {
      // No main target — nothing to wire. Bail out gracefully.
      return cfg;
    }

    // Create (or reuse) a group for the App Intents sources, anchored at
    // the same SOURCE_ROOT-relative path as the with-live-activity plugin
    // does for `ios-widget`.
    const groupName = 'AppIntents';
    const groupPath = `../${SWIFT_SRC_DIR}`;
    const group = project.addPbxGroup?.([], groupName, groupPath);
    if (group && project.getFirstProject && project.addToPbxGroup) {
      const mainGroupUuid = project.getFirstProject().firstProject.mainGroup;
      project.addToPbxGroup(group.uuid, mainGroupUuid);
    }

    for (const file of SWIFT_FILES) {
      const relPath = path.posix.join(`../${SWIFT_SRC_DIR}`, file);
      // Idempotency: skip if a file ref with this path already exists.
      if (project.hasFile?.(relPath)) {
        continue;
      }
      const fileRef = project.addFile?.(relPath, group?.uuid, {
        sourceTree: 'SOURCE_ROOT',
        target: mainTarget.uuid,
      });
      if (fileRef) {
        project.addToPbxSourcesBuildPhase?.(fileRef, mainTarget.uuid);
      }
    }

    return cfg;
  });
};

export default withAppIntentsSources;
