/**
 * Shared helper: add a Swift/Objective-C source file to a target's compile
 * sources, registering all three pbx sections correctly.
 *
 * Why this exists:
 *   The xcode npm package exposes two related APIs:
 *     - `addFile(path, group, opts)` -- creates a PBXFileReference (sets
 *       `file.fileRef`) and adds it to a PBXGroup, but does NOT create the
 *       PBXBuildFile entry and does NOT set `file.uuid`.
 *     - `addSourceFile(path, opts, group)` -- internally calls `addFile`,
 *       then sets `file.uuid = generateUuid()`, registers the PBXBuildFile,
 *       and pushes onto the target's PBXSourcesBuildPhase.
 *
 *   The widget/extension plugins were calling `addFile` followed by
 *   `addToPbxSourcesBuildPhase(file, target.uuid)` directly. Because
 *   `file.uuid` is undefined after `addFile`, the entries pushed into the
 *   sources phase had `value: undefined`. CocoaPods' `xcodeproj` Ruby gem
 *   warns and discards these on save: `<PBXSourcesBuildPhase
 *   UUID=13B07F871A680F5B00A75B9A> attempted to initialize an object with
 *   an unknown UUID. undefined for attribute: files.` 24+ warnings caused
 *   the post-install hook (`fix_library_search_paths`) to fail.
 *
 *   This helper prefers `addSourceFile` (correct on real xcode projects).
 *   For unit-test stubs that only mock `addFile` + `addToPbxSourcesBuildPhase`,
 *   we fall back to that pair so existing tests continue to pass.
 *
 *   When the file is ALREADY registered (xcode npm's addSourceFile/addFile
 *   bail out via hasFile() if the path matches an existing PBXFileReference),
 *   we look up the existing fileRef and create a NEW PBXBuildFile pointing to
 *   it for the requested target. This is required to share a single source
 *   file across multiple targets (e.g. LiveActivityDemoAttributes.swift on
 *   both the widget extension and the main app).
 */

import * as path from 'path';

interface XcodeFileLike {
  fileRef?: string;
  uuid?: string;
  target?: string;
  path?: string;
  basename?: string;
  group?: string;
  [key: string]: unknown;
}

// Loose project shape -- callers each have their own narrower PbxProject
// interface, so we accept any object and probe at runtime.
type XcodeProjectLike = object;

interface AddSourceFileOpts {
  sourceTree: string;
  target: string;
}

type AddSourceFileFn = (
  path: string,
  opts: { sourceTree?: string; target?: string },
  group?: string,
) => XcodeFileLike | false | null;

type AddFileFn = (
  path: string,
  group: string | undefined,
  opts: { sourceTree?: string; target?: string },
) => XcodeFileLike | false | null;

type AddToPbxSourcesBuildPhaseFn = (file: XcodeFileLike, targetUuid?: string) => void;
type AddToPbxBuildFileSectionFn = (file: XcodeFileLike) => void;
type HasFileFn = (filePath: string) => XcodeFileLike | false;
type GenerateUuidFn = () => string;

export function addSwiftSourceFile(
  project: XcodeProjectLike,
  filePath: string,
  groupUuid: string | undefined,
  opts: AddSourceFileOpts,
): XcodeFileLike | null {
  const addSourceFile = (project as { addSourceFile?: AddSourceFileFn }).addSourceFile;
  // Preferred path: real xcode npm package -- registers PBXFileReference,
  // PBXBuildFile, and PBXSourcesBuildPhase entries with matching UUIDs.
  if (typeof addSourceFile === 'function') {
    const file = addSourceFile.call(project, filePath, opts, groupUuid);
    if (file !== false && file != null) {
      return file;
    }
    // addSourceFile returned false: the PBXFileReference already exists for
    // this path. Reuse the existing fileRef and create a new PBXBuildFile so
    // the file compiles into the requested target as well.
    return attachExistingFileToTarget(project, filePath, opts.target);
  }

  // Fallback path: unit-test stubs that don't implement addSourceFile.
  const addFile = (project as { addFile?: AddFileFn }).addFile;
  if (typeof addFile !== 'function') {
    return null;
  }
  const fileRef = addFile.call(project, filePath, groupUuid, opts);
  if (!fileRef) {
    return null;
  }
  const addToPbxSourcesBuildPhase = (
    project as { addToPbxSourcesBuildPhase?: AddToPbxSourcesBuildPhaseFn }
  ).addToPbxSourcesBuildPhase;
  addToPbxSourcesBuildPhase?.call(project, fileRef, opts.target);
  return fileRef;
}

function attachExistingFileToTarget(
  project: XcodeProjectLike,
  filePath: string,
  targetUuid: string,
): XcodeFileLike | null {
  const projectAny = project as {
    hasFile?: HasFileFn;
    pbxFileReferenceSection?: () => Record<string, { path?: string }>;
    generateUuid?: GenerateUuidFn;
    addToPbxBuildFileSection?: AddToPbxBuildFileSectionFn;
    addToPbxSourcesBuildPhase?: AddToPbxSourcesBuildPhaseFn;
  };

  if (
    typeof projectAny.hasFile !== 'function' ||
    typeof projectAny.pbxFileReferenceSection !== 'function' ||
    typeof projectAny.generateUuid !== 'function' ||
    typeof projectAny.addToPbxBuildFileSection !== 'function' ||
    typeof projectAny.addToPbxSourcesBuildPhase !== 'function'
  ) {
    return null;
  }

  // hasFile() returns the PBXFileReference VALUE object, but xcode npm stores
  // the UUID as the KEY in pbxFileReferenceSection. We must scan the section
  // ourselves to recover the UUID (which is the fileRef we need).
  const section = projectAny.pbxFileReferenceSection();
  let fileRefUuid: string | undefined;
  let existing: { path?: string } | undefined;
  for (const key of Object.keys(section)) {
    if (key.endsWith('_comment')) continue;
    const entry = section[key];
    if (!entry || typeof entry !== 'object') continue;
    const entryPath = (entry as { path?: string }).path;
    if (entryPath === filePath || entryPath === `"${filePath}"`) {
      fileRefUuid = key;
      existing = entry as { path?: string };
      break;
    }
  }

  if (!fileRefUuid || !existing) {
    return null;
  }

  // Build a fresh pbxFile-shaped record. xcode npm's pbxBuildFileObj uses
  // file.uuid as the BuildFile UUID and file.fileRef + file.basename for the
  // PBXBuildFile entry; pbxBuildPhaseObj uses file.uuid + longComment(file)
  // (= "<basename> in <group>") for the sources-phase entry. Pre-existing
  // PBXFileReference paths are stored already wrapped in quotes, so strip
  // them when computing the basename for comments.
  const cleanPath =
    typeof existing.path === 'string'
      ? existing.path.replace(/^"|"$/g, '')
      : filePath;
  const basename = path.posix.basename(cleanPath);

  const dupFile: XcodeFileLike = {
    uuid: projectAny.generateUuid(),
    fileRef: fileRefUuid,
    basename,
    group: 'Sources',
    target: targetUuid,
    path: cleanPath,
  };

  projectAny.addToPbxBuildFileSection(dupFile);
  projectAny.addToPbxSourcesBuildPhase(dupFile);
  return dupFile;
}
