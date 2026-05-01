/**
 * Adds the two Focus Filter Swift sources to the main app target.
 *
 * Idempotent: a second invocation MUST NOT add duplicate file refs.
 *
 * @see specs/029-focus-filters/tasks.md T048
 */

import * as _cp from '@expo/config-plugins';
import type { ConfigPlugin } from '@expo/config-plugins';
const configPlugins = (_cp as { default?: typeof _cp }).default ?? _cp;
const { withXcodeProject } = configPlugins;
import * as path from 'path';

const SWIFT_SRC_DIR = 'native/ios/focus-filters';
const SWIFT_FILES: readonly string[] = ['ShowcaseModeFilter.swift', 'FocusFilterStorage.swift'];

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

export const withFocusFiltersSwiftSources: ConfigPlugin = (config) => {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults as unknown as PbxProject;
    const projectName = cfg.modRequest.projectName ?? 'spot';

    const mainTarget = project.pbxTargetByName?.(projectName) ?? project.getFirstTarget?.();
    if (!mainTarget) {
      throw new Error('with-focus-filters: main app target not found. Cannot add Swift sources.');
    }

    // Create (or reuse) a group for the Focus Filters sources
    const groupName = 'FocusFilters';
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

export default withFocusFiltersSwiftSources;
